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

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");
    const eventId =
      request.headers.get("x-razorpay-event-id") ||
      `body_${await digestEventBody(rawBody)}`;

    if (!signature) {
      throw new HttpError(401, "missing_webhook_signature", "Missing Razorpay webhook signature.");
    }

    const isVerified = verifyRazorpayWebhookSignature({ rawBody, signature });

    if (!isVerified) {
      throw new HttpError(401, "invalid_webhook_signature", "Invalid Razorpay webhook signature.");
    }

    if (await hasProcessedWebhookEvent(eventId)) {
      return ok({ message: "Webhook already processed.", duplicate: true });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const { orderId, paymentId, email } = await extractPaymentDetails(event);

    if (!HANDLED_EVENTS.has(eventType)) {
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
      throw new HttpError(
        400,
        "webhook_payload_incomplete",
        "Webhook payload did not contain order or email details."
      );
    }

    if (eventType === "payment.failed") {
      const failedPaymentId = paymentId || eventId;
      await markPaymentFailed({
        email,
        razorpayOrderId: orderId,
        razorpayPaymentId: failedPaymentId,
        eventId,
        rawEvent: event
      });

      await markWebhookEventProcessed({
        eventId,
        eventType,
        razorpayOrderId: orderId,
        razorpayPaymentId: failedPaymentId,
        rawEvent: event
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
    const license = await createLicense({
      email,
      paymentId: payment.provider_payment_id,
      paymentRecordId: payment.id,
      rawEvent: payment.raw_event
    });

    if (!license.already_active) {
      await sendWelcomeEmail(email, license.license_ref);
    }

    await markWebhookEventProcessed({
      eventId,
      eventType,
      razorpayOrderId: orderId,
      razorpayPaymentId: stablePaymentId,
      rawEvent: event
    });

    return ok({
      message: "Webhook processed.",
      eventId,
      eventType,
      licenseRef: license.license_ref
    });
  } catch (error) {
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
