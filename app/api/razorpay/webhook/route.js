import {
  createLicense,
  getPendingOrderByRazorpayOrderId,
  hasProcessedWebhookEvent,
  markPaymentSuccess,
  markWebhookEventProcessed
} from "../../../../lib/db";
import crypto from "crypto";
import { sendWelcomeEmail } from "../../../../lib/server/email";
import { fail, HttpError, ok } from "../../../../lib/server/errors";
import { verifyRazorpayWebhookSignature } from "../../../../lib/server/razorpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUCCESS_EVENTS = new Set(["payment.captured", "order.paid"]);

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

  try {
    rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");
    eventId =
      request.headers.get("x-razorpay-event-id") ||
      `body_${await digestEventBody(rawBody)}`;

    if (!signature) {
      throw new HttpError(400, "missing_webhook_signature", "Missing Razorpay webhook signature.");
    }

    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      console.error("webhook_verified", {
        verified: false,
        reason: "missing_webhook_secret"
      });
      throw new HttpError(500, "configuration_missing", "RAZORPAY_WEBHOOK_SECRET is not configured.");
    }

    const isVerified = verifyRazorpayWebhookSignature({ rawBody, signature });
    if (!isVerified) {
      console.warn("webhook_verified", {
        verified: false,
        reason: "invalid_signature"
      });
      throw new HttpError(401, "invalid_webhook_signature", "Invalid Razorpay webhook signature.");
    }

    let event;
    try {
      event = JSON.parse(rawBody);
    } catch (error) {
      throw new HttpError(400, "invalid_webhook_json", "Webhook body must be valid JSON.");
    }

    eventType = event.event || "unknown";

    const details = await extractPaymentDetails(event);
    const orderId = details.orderId;
    const paymentId = details.paymentId;
    const email = details.email;

    console.log("webhook_received", {
      eventType,
      orderId,
      paymentId
    });

    console.log("webhook_verified", {
      verified: true,
      eventType,
      orderId,
      paymentId
    });

    const webhookAlreadyProcessed = await hasProcessedWebhookEvent(eventId);

    if (!SUCCESS_EVENTS.has(eventType)) {
      if (webhookAlreadyProcessed) {
        return ok({ message: "Webhook already processed.", duplicate: true });
      }

      await markWebhookEventProcessed({
        eventId,
        eventType,
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        rawEvent: event
      });

      return ok({ message: "Webhook ignored.", ignored: true });
    }

    if (!orderId || !email) {
      await markWebhookEventProcessed({
        eventId,
        eventType,
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        rawEvent: event
      });

      return ok({
        message: "Webhook accepted but payment context was incomplete.",
        eventType,
        incomplete: true
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

    const license = await createLicense({
      email,
      paymentId: payment.provider_payment_id,
      paymentRecordId: payment.id,
      rawEvent: payment.raw_event
    });

    await sendWelcomeEmail(email, {
      payment,
      license,
      trigger: "razorpay-webhook",
      eventId,
      eventType
    });

    await markWebhookEventProcessed({
      eventId,
      eventType,
      razorpayOrderId: orderId,
      razorpayPaymentId: stablePaymentId,
      rawEvent: event
    });

    return ok({
      message: "Webhook processed."
    });
  } catch (error) {
    console.error("webhook_received", {
      eventType,
      accepted: false,
      code: error.code || error.name,
      message: error.message
    });

    if (error instanceof HttpError) {
      return fail(error);
    }

    if (eventId && rawBody) {
      return ok({
        message: "Webhook accepted but internal processing failed.",
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
