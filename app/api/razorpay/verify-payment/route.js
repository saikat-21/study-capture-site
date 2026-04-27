import {
  createLicense,
  getPendingOrderByRazorpayOrderId,
  markPaymentSuccess
} from "../../../../lib/db";
import { sendWelcomeEmail } from "../../../../lib/server/email";
import { fail, HttpError, ok, readJson } from "../../../../lib/server/errors";
import { verifyRazorpayPaymentSignature } from "../../../../lib/server/razorpay";
import {
  normalizeEmail,
  normalizeRequiredString
} from "../../../../lib/server/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await readJson(request);
    const email = normalizeEmail(body.email);
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
      rawEvent: payment.raw_event
    });

    if (!license.already_active) {
      await sendWelcomeEmail(email, license.license_ref);
    }

    return ok({
      message: "Payment verified. Study Capture Pro is active.",
      email,
      plan: "pro",
      licenseRef: license.license_ref
    });
  } catch (error) {
    return fail(error);
  }
}
