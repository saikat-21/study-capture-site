import { buildWelcomeEmail } from "../email/welcome-template";
import {
  claimEmailEvent,
  markEmailEventFailed,
  markEmailEventSent
} from "../db";

const WELCOME_EMAIL_TYPE = "pro_payment_confirmation";
const DEFAULT_PAID_PRICE_INR = 499;
const DEFAULT_ORIGINAL_PRICE_INR = 799;
const SUPPORT_EMAIL = "support@studycapture.co";

export async function sendEmail({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey) {
    console.error("pro_welcome_email_failed", {
      recipientEmail: to,
      reason: "RESEND_API_KEY is not configured"
    });
    throw new Error("RESEND_API_KEY is not configured.");
  }

  if (!from) {
    console.error("pro_welcome_email_failed", {
      recipientEmail: to,
      reason: "RESEND_FROM_EMAIL is not configured"
    });
    throw new Error("RESEND_FROM_EMAIL is not configured.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      text
    })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Resend email failed: ${details}`);
  }

  return response.json();
}

export async function sendWelcomeEmail(email, context = {}) {
  const payment = context.payment || null;
  const license = context.license || null;
  const trigger = context.trigger || "unknown";
  const recipient = email || payment?.email || license?.email || null;
  const price = resolveEmailPrice(payment);
  const eventKey = buildWelcomeEmailEventKey({ email: recipient, payment });
  const safeLog = buildWelcomeEmailLogContext({
    recipient,
    payment,
    eventType: context.eventType
  });

  if (!recipient) {
    console.error("pro_welcome_email_failed", {
      ...safeLog,
      reason: "missing_recipient_email"
    });
    return {
      skipped: true,
      reason: "missing_recipient_email"
    };
  }

  const claim = await claimEmailEvent({
    eventKey,
    type: WELCOME_EMAIL_TYPE,
    email: recipient,
    paymentId: payment?.id || null,
    licenseId: license?.id || null,
    metadata: {
      trigger,
      provider_order_id: payment?.provider_order_id || null,
      provider_payment_id: payment?.provider_payment_id || null,
      paid_price_inr: price.paidPriceInr,
      original_price_inr: price.originalPriceInr
    }
  });

  if (!claim.shouldSend) {
    return {
      skipped: true,
      reason: claim.reason || "email_already_handled",
      status: claim.status
    };
  }

  const message = buildWelcomeEmail({
    email: recipient,
    paymentId: payment?.provider_payment_id || payment?.provider_order_id || "Recorded",
    supportEmail: SUPPORT_EMAIL
  });
  let lastError = null;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const result = await sendEmail({ to: recipient, ...message });

      await markEmailEventSent({
        eventKey,
        providerMessageId: result?.id || null,
        metadata: { trigger, resend: result || null }
      });

      console.log("pro_welcome_email_sent", {
        ...safeLog
      });

      return result;
    } catch (error) {
      lastError = error;
      console.error("pro_welcome_email_failed", {
        ...safeLog,
        attempt,
        error: error.message
      });
    }
  }

  try {
    await markEmailEventFailed({
      eventKey,
      errorMessage: lastError?.message || "unknown_email_error",
      metadata: { trigger }
    });
  } catch (error) {
    console.error("pro_welcome_email_failed", {
      ...safeLog,
      reason: "mark_failed_record_error",
      error: error.message
    });
  }

  return {
    skipped: true,
    reason: "welcome_email_delivery_failed",
    error: lastError?.message || "unknown_email_error"
  };
}

function buildWelcomeEmailEventKey({ email, payment }) {
  const stableId =
    payment?.provider_order_id ||
    payment?.provider_payment_id ||
    payment?.id ||
    email;

  return `${WELCOME_EMAIL_TYPE}:${stableId}`;
}

function buildWelcomeEmailLogContext({ recipient, payment, eventType }) {
  return {
    recipientEmail: recipient || null,
    paymentId: payment?.provider_payment_id || payment?.provider_order_id || null,
    eventType: eventType || null
  };
}

function resolveEmailPrice(payment) {
  const metadata = payment?.raw_event?.study_capture || {};
  const rawPaidPrice = Number(metadata.paid_price_inr);
  const rawOriginalPrice = Number(metadata.original_price_inr);
  const amountPrice = Number(payment?.amount) > 0 ? Math.round(Number(payment.amount) / 100) : null;

  return {
    paidPriceInr: Number.isFinite(rawPaidPrice) && rawPaidPrice > 0
      ? rawPaidPrice
      : amountPrice || DEFAULT_PAID_PRICE_INR,
    originalPriceInr: Number.isFinite(rawOriginalPrice) && rawOriginalPrice > 0
      ? rawOriginalPrice
      : DEFAULT_ORIGINAL_PRICE_INR
  };
}
