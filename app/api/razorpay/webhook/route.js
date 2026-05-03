import {
  createLicense,
  getPendingOrderByRazorpayOrderId,
  hasProcessedWebhookEvent,
  markPaymentFailed,
  markPaymentSuccess,
  markWebhookEventProcessed
} from "../../../../lib/db";
import crypto from "crypto";
import { sendWelcomeEmail } from "../../../../lib/server/email";
import { fail, HttpError, ok } from "../../../../lib/server/errors";
import { verifyRazorpayWebhookSignature } from "../../../../lib/server/razorpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HANDLED_EVENTS = new Set(["payment.captured", "order.paid", "payment.failed"]);
const REQUIRED_ENV_VARS = [
  "RAZORPAY_WEBHOOK_SECRET",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL"
];

export async function GET() {
  return ok({
    route: "razorpay webhook",
    method: "GET not used by Razorpay"
  });
}

export async function POST(request) {
  let rawBody = "";
  let eventId = null;
  let eventType = null;
  let orderId = null;
  let paymentId = null;
  let email = null;

  try {
    console.log("Razorpay webhook received.", {
      method: "POST",
      contentType: request.headers.get("content-type") || null,
      userAgent: request.headers.get("user-agent") || null
    });

    logWebhookEnvironmentStatus();

    rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");
    const webhookSecretExists = Boolean(process.env.RAZORPAY_WEBHOOK_SECRET);
    eventId =
      request.headers.get("x-razorpay-event-id") ||
      `body_${await digestEventBody(rawBody)}`;

    console.log("Razorpay webhook signature input.", {
      eventId,
      signatureHeaderExists: Boolean(signature),
      webhookSecretExists,
      rawBodyLength: rawBody.length
    });

    if (!signature) {
      console.warn("Razorpay webhook signature verification result.", {
        eventId,
        verified: false,
        reason: "missing_signature"
      });
      throw new HttpError(400, "missing_webhook_signature", "Missing Razorpay webhook signature.");
    }

    if (!webhookSecretExists) {
      console.error("Razorpay webhook configuration missing.", {
        eventId,
        webhookSecretExists: false
      });
      throw new HttpError(500, "configuration_missing", "RAZORPAY_WEBHOOK_SECRET is not configured.");
    }

    const isVerified = verifyRazorpayWebhookSignature({ rawBody, signature });
    console.log("Razorpay webhook signature verification result.", {
      eventId,
      verified: isVerified
    });

    if (!isVerified) {
      throw new HttpError(401, "invalid_webhook_signature", "Invalid Razorpay webhook signature.");
    }

    let event;
    try {
      event = JSON.parse(rawBody);
    } catch (error) {
      console.warn("Razorpay webhook JSON parse failed after valid signature.", {
        eventId,
        error: error.message
      });
      throw new HttpError(400, "invalid_webhook_json", "Webhook body must be valid JSON.");
    }

    if (await hasProcessedWebhookEvent(eventId)) {
      console.log("Razorpay webhook duplicate ignored.", {
        eventId
      });
      return ok({ message: "Webhook already processed.", duplicate: true });
    }

    eventType = event.event || "unknown";
    const details = await extractPaymentDetails(event);
    orderId = details.orderId;
    paymentId = details.paymentId;
    email = details.email;

    console.log("Razorpay webhook event parsed.", {
      eventId,
      eventType,
      orderId,
      paymentId,
      email
    });

    if (!HANDLED_EVENTS.has(eventType)) {
      const webhookRecord = await markWebhookEventProcessed({
        eventId,
        eventType,
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        rawEvent: event
      });

      console.log("Razorpay webhook ignored event recorded.", {
        eventId,
        eventType,
        dbUpdateResult: summarizeRecord(webhookRecord)
      });

      return ok({ message: "Webhook ignored.", ignored: true });
    }

    if (!orderId || !email) {
      const webhookRecord = await markWebhookEventProcessed({
        eventId,
        eventType,
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        rawEvent: event
      });

      console.warn("Razorpay webhook valid event missing payment context.", {
        eventId,
        eventType,
        orderId,
        paymentId,
        emailPresent: Boolean(email),
        dbUpdateResult: summarizeRecord(webhookRecord)
      });

      return ok({
        message: "Webhook accepted but payment context was incomplete.",
        eventId,
        eventType,
        incomplete: true
      });
    }

    if (eventType === "payment.failed") {
      const failedPaymentId = paymentId || eventId;
      const failedPayment = await markPaymentFailed({
        email,
        razorpayOrderId: orderId,
        razorpayPaymentId: failedPaymentId,
        eventId,
        rawEvent: event
      });

      console.log("Razorpay webhook payment failure DB update result.", {
        eventId,
        eventType,
        orderId,
        paymentId: failedPaymentId,
        dbUpdateResult: summarizePayment(failedPayment)
      });

      const webhookRecord = await markWebhookEventProcessed({
        eventId,
        eventType,
        razorpayOrderId: orderId,
        razorpayPaymentId: failedPaymentId,
        rawEvent: event
      });

      console.log("Razorpay webhook event processed marker result.", {
        eventId,
        eventType,
        dbUpdateResult: summarizeRecord(webhookRecord),
        emailEventResult: "not_applicable_for_failed_payment"
      });

      return ok({
        message: "Failed payment recorded.",
        eventId,
        eventType
      });
    }

    const stablePaymentId = paymentId || eventId;
    const payment = await markPaymentSuccess({
      email,
      razorpayOrderId: orderId,
      razorpayPaymentId: stablePaymentId,
      eventId,
      rawEvent: event
    });
    console.log("Razorpay webhook payment success DB update result.", {
      eventId,
      eventType,
      orderId,
      paymentId: stablePaymentId,
      dbUpdateResult: summarizePayment(payment)
    });

    const license = await createLicense({
      email,
      paymentId: payment.provider_payment_id,
      paymentRecordId: payment.id,
      rawEvent: payment.raw_event
    });
    console.log("Razorpay webhook license activation DB update result.", {
      eventId,
      eventType,
      email,
      dbUpdateResult: summarizeLicense(license)
    });

    const emailResult = await sendWelcomeEmail(email, {
      payment,
      license,
      trigger: "razorpay-webhook",
      eventId,
      eventType
    });
    console.log("Razorpay webhook email event result.", {
      eventId,
      eventType,
      email,
      emailEventResult: summarizeEmailResult(emailResult)
    });

    const webhookRecord = await markWebhookEventProcessed({
      eventId,
      eventType,
      razorpayOrderId: orderId,
      razorpayPaymentId: stablePaymentId,
      rawEvent: event
    });
    console.log("Razorpay webhook event processed marker result.", {
      eventId,
      eventType,
      dbUpdateResult: summarizeRecord(webhookRecord)
    });

    return ok({
      message: "Webhook processed.",
      eventId,
      eventType
    });
  } catch (error) {
    console.error("Razorpay webhook handling error.", {
      eventId,
      eventType,
      orderId,
      paymentId,
      email,
      error: {
        name: error.name,
        code: error.code || null,
        status: error.status || null,
        message: error.message
      }
    });

    if (error instanceof HttpError) {
      return fail(error);
    }

    if (eventId && rawBody) {
      return ok({
        message: "Webhook accepted but internal processing failed.",
        eventId,
        eventType,
        processed: false
      });
    }

    return fail(error);
  }
}

async function extractPaymentDetails(event) {
  const payment = event.payload?.payment?.entity || null;
  const order = event.payload?.order?.entity || null;
  const orderId = payment?.order_id || order?.id || null;
  const paymentId = payment?.id || order?.payments?.items?.[0]?.id || null;
  let email =
    payment?.email ||
    payment?.notes?.email ||
    order?.notes?.email ||
    null;

  if (!email && orderId) {
    const pendingOrder = await getPendingOrderByRazorpayOrderId(orderId);
    email = pendingOrder?.email || null;
  }

  return { orderId, paymentId, email };
}

async function digestEventBody(rawBody) {
  return crypto.createHash("sha256").update(rawBody).digest("hex");
}

function logWebhookEnvironmentStatus() {
  const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);
  const present = Object.fromEntries(
    REQUIRED_ENV_VARS.map((name) => [name, Boolean(process.env[name])])
  );

  if (missing.length > 0) {
    console.warn("Razorpay webhook environment check.", {
      ok: false,
      webhookSecretExists: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET),
      present,
      missing
    });
    return;
  }

  console.log("Razorpay webhook environment check.", {
    ok: true,
    webhookSecretExists: true,
    present,
    checked: REQUIRED_ENV_VARS
  });
}

function summarizePayment(payment) {
  if (!payment) return null;

  return {
    id: payment.id || null,
    status: payment.status || null,
    email: payment.email || null,
    provider_order_id: payment.provider_order_id || null,
    provider_payment_id: payment.provider_payment_id || null,
    amount: payment.amount || null,
    currency: payment.currency || null
  };
}

function summarizeLicense(license) {
  if (!license) return null;

  return {
    id: license.id || null,
    email: license.email || null,
    state: license.state || null,
    max_devices: license.max_devices || null,
    already_active: Boolean(license.already_active)
  };
}

function summarizeEmailResult(result) {
  if (!result) return null;

  return {
    skipped: Boolean(result.skipped),
    reason: result.reason || null,
    status: result.status || null,
    resendId: result.id || null,
    error: result.error || null
  };
}

function summarizeRecord(record) {
  if (!record) return null;

  return {
    id: record.id || null,
    event_id: record.event_id || null,
    event_type: record.event_type || null,
    processed_at: record.processed_at || null
  };
}
