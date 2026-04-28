import {
  createLicense,
  getPendingOrderByRazorpayOrderId,
  markPaymentSuccess
} from "../../../../lib/db";
import { sendWelcomeEmail } from "../../../../lib/server/email";
import { fail, HttpError, ok, readJson } from "../../../../lib/server/errors";
import { signActivationGrant } from "../../../../lib/server/license-token";
import { verifyRazorpayPaymentSignature } from "../../../../lib/server/razorpay";
import { maybeAssertRateLimit, maybeRecordAuthEvent } from "../../../../lib/server/rate-limit";
import {
  normalizeEmail,
  normalizeRequiredString
} from "../../../../lib/server/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  let email;
  let rateLimitContext;

  try {
    const body = await readJson(request);
    email = normalizeEmail(body.email);
    const razorpayOrderId = normalizeRequiredString(
      body.razorpay_order_id,
      "razorpay_order_id",
      80
    );
    const razorpayPaymentId = normalizeRequiredString(
      body.razorpay_payment_id,
      "razorpay_payment_id",
      80
    );
    const razorpaySignature = normalizeRequiredString(
      body.razorpay_signature,
      "razorpay_signature",
      160
    );

    rateLimitContext = await maybeAssertRateLimit({
      request,
      email,
      eventType: "payment_verify",
      windowSeconds: 15 * 60,
      emailLimit: 20,
      ipLimit: 80
    });

    const order = await getPendingOrderByRazorpayOrderId(razorpayOrderId);

    if (!order) {
      throw new HttpError(404, "order_not_found", "Payment order was not found.");
    }

    if (order.email !== email) {
      throw new HttpError(403, "email_mismatch", "Payment email does not match the order.");
    }

    const isVerified = verifyRazorpayPaymentSignature({
      orderId: order.provider_order_id,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature
    });

    if (!isVerified) {
      throw new HttpError(401, "invalid_signature", "Payment signature verification failed.");
    }

    const payment = await markPaymentSuccess({
      email,
      razorpayOrderId: order.provider_order_id,
      razorpayPaymentId,
      rawEvent: {
        source: "checkout_success_callback",
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId
      }
    });
    const license = await createLicense({
      email,
      paymentId: payment.provider_payment_id,
      paymentRecordId: payment.id,
      rawEvent: payment.raw_event
    });

    if (!license.already_active) {
      await sendWelcomeEmail(email);
    }

    const activationGrant = signActivationGrant({
      email,
      licenseId: license.id || null
    });

    await maybeRecordAuthEvent({
      supabase: rateLimitContext?.supabase,
      request,
      email,
      eventType: "payment_verify",
      success: true,
      metadata: {
        razorpayOrderId,
        razorpayPaymentId,
        licenseRef: license.license_ref
      }
    });

    return ok({
      message: "Payment verified. Study Capture Pro is active.",
      email,
      plan: "pro",
      activationGrant: activationGrant.token,
      activationGrantExpiresAt: activationGrant.payload.activationGrantExpiresAt
    });
  } catch (error) {
    await maybeRecordAuthEvent({
      supabase: rateLimitContext?.supabase,
      request,
      email,
      eventType: "payment_verify",
      success: false,
      metadata: { reason: error.code || error.message }
    });
    return fail(error);
  }
}
