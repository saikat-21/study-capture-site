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
    console.warn("pro_welcome_email_failed", {
      to,
      subject,
      reason: "RESEND_API_KEY is not configured."
    });
    return {
      skipped: true,
      reason: "RESEND_API_KEY is not configured."
    };
  }

  if (!from) {
    console.warn("pro_welcome_email_failed", {
      to,
      subject,
      reason: "RESEND_FROM_EMAIL is not configured."
    });
    return {
      skipped: true,
      reason: "RESEND_FROM_EMAIL is not configured."
    };
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

  const result = await response.json();
  console.log("Study Capture email sent via Resend.", {
    to,
    subject,
    resendId: result?.id || null
  });
  return result;
}

export async function sendWelcomeEmail(email, context = {}) {
  const payment = context.payment || null;
  const license = context.license || null;
  const trigger = context.trigger || "unknown";
  const recipient = email || payment?.email || license?.email || null;
  const price = resolveEmailPrice(payment);
  const eventKey = buildWelcomeEmailEventKey({ email: recipient, payment });

  console.log("Study Capture Pro confirmation email requested.", {
    email: recipient,
    trigger,
    eventKey,
    fromConfigured: Boolean(process.env.RESEND_FROM_EMAIL),
    resendConfigured: Boolean(process.env.RESEND_API_KEY),
    providerOrderId: payment?.provider_order_id || null,
    providerPaymentId: payment?.provider_payment_id || null,
    licenseId: license?.id || null,
    paidPriceInr: price.paidPriceInr,
    originalPriceInr: price.originalPriceInr
  });

  if (!recipient) {
    console.warn("pro_welcome_email_failed", {
      trigger,
      eventKey,
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
    console.log("pro_welcome_email_skipped_duplicate", {
      email: recipient,
      trigger,
      eventKey,
      status: claim.status,
      reason: claim.reason
    });
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
      console.log("Sending Study Capture Pro confirmation email.", {
        email: recipient,
        trigger,
        eventKey,
        attempt
      });
      const result = await sendEmail({ to: recipient, ...message });

      if (result?.skipped) {
        await markEmailEventFailed({
          eventKey,
          errorMessage: result.reason,
          metadata: { trigger, skipped: true }
        });
        console.warn("pro_welcome_email_failed", {
          email: recipient,
          trigger,
          eventKey,
          reason: result.reason
        });
        return result;
      }

      await markEmailEventSent({
        eventKey,
        providerMessageId: result?.id || null,
        metadata: { trigger, resend: result || null }
      });

      console.log("pro_welcome_email_sent", {
        email: recipient,
        trigger,
        eventKey,
        providerMessageId: result?.id || null
      });

      return result;
    } catch (error) {
      lastError = error;
      console.error("pro_welcome_email_failed", {
        email: recipient,
        trigger,
        eventKey,
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
    console.error("Could not record Study Capture email failure.", {
      email: recipient,
      trigger,
      eventKey,
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
    payment?.provider_payment_id ||
    payment?.provider_order_id ||
    payment?.id ||
    email;

  return `${WELCOME_EMAIL_TYPE}:${stableId}`;
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
      : DEFAULT_ORIGINAL_PRICE_INR,
    testMode: metadata.test_mode === true || metadata.test_mode === "true"
  };
}
