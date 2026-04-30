import { buildWelcomeEmail } from "../email/welcome-template";
import {
  claimEmailEvent,
  markEmailEventFailed,
  markEmailEventSent
} from "../db";

const WELCOME_EMAIL_TYPE = "pro_payment_confirmation";
const DEFAULT_PAID_PRICE_INR = 499;
const DEFAULT_ORIGINAL_PRICE_INR = 799;

export async function sendEmail({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "Study Capture <billing@studycapture.co>";

  if (!apiKey) {
    console.warn("Study Capture email skipped: RESEND_API_KEY is not configured.", {
      to,
      subject
    });
    return {
      skipped: true,
      reason: "RESEND_API_KEY is not configured."
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
  const price = resolveEmailPrice(payment);
  const eventKey = buildWelcomeEmailEventKey({ email, payment });

  console.log("Study Capture Pro confirmation email requested.", {
    email,
    trigger,
    eventKey,
    from: process.env.RESEND_FROM_EMAIL || "Study Capture <billing@studycapture.co>",
    providerOrderId: payment?.provider_order_id || null,
    providerPaymentId: payment?.provider_payment_id || null,
    licenseId: license?.id || null,
    paidPriceInr: price.paidPriceInr,
    originalPriceInr: price.originalPriceInr
  });

  const claim = await claimEmailEvent({
    eventKey,
    type: WELCOME_EMAIL_TYPE,
    email,
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
    console.log("Study Capture Pro confirmation email skipped by idempotency guard.", {
      email,
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
    email,
    paidPriceLabel: buildPaidPriceLabel(price),
    originalPriceLabel: `₹${price.originalPriceInr}`
  });
  let lastError = null;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      console.log("Sending Study Capture Pro confirmation email.", {
        email,
        trigger,
        eventKey,
        attempt
      });
      const result = await sendEmail({ to: email, ...message });

      if (result?.skipped) {
        await markEmailEventFailed({
          eventKey,
          errorMessage: result.reason,
          metadata: { trigger, skipped: true }
        });
        return result;
      }

      await markEmailEventSent({
        eventKey,
        providerMessageId: result?.id || null,
        metadata: { trigger, resend: result || null }
      });

      return result;
    } catch (error) {
      lastError = error;
      console.error("Study Capture Pro confirmation email attempt failed.", {
        email,
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
      email,
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
    payment?.provider_order_id ||
    payment?.provider_payment_id ||
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

function buildPaidPriceLabel(price) {
  if (price.testMode) return `₹${price.paidPriceInr} (Founder live test)`;
  if (price.paidPriceInr === DEFAULT_PAID_PRICE_INR) return "₹499 (Introductory)";
  return `₹${price.paidPriceInr}`;
}
