import { createPendingOrder } from "../../../../lib/db";
import { fail, ok, readJson } from "../../../../lib/server/errors";
import {
  buildRazorpayReceipt,
  createRazorpayOrder,
  getRazorpayKeyId,
  PRO_CURRENCY
} from "../../../../lib/server/razorpay";
import { maybeAssertRateLimit, maybeRecordAuthEvent } from "../../../../lib/server/rate-limit";
import { normalizeEmail } from "../../../../lib/server/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEST_AMOUNT_PAISE = 1000;
const TEST_PRICE_INR = 10;
const TEST_SOURCE = "temporary_test_checkout";
const TEST_REASON = "pro_license_email_flow_test";

export async function POST(request) {
  let email;
  let rateLimitContext;

  try {
    const body = await readJson(request);
    email = normalizeEmail(body.email);

    rateLimitContext = await maybeAssertRateLimit({
      request,
      email,
      eventType: "test_payment_order_create",
      windowSeconds: 60 * 60,
      emailLimit: 10,
      ipLimit: 30
    });

    const receipt = buildRazorpayReceipt({
      email,
      source: "test10"
    });
    const pricingMetadata = {
      test_mode: true,
      source: TEST_SOURCE,
      original_source: TEST_SOURCE,
      original_price_inr: TEST_PRICE_INR,
      paid_price_inr: TEST_PRICE_INR
    };

    const razorpayOrder = await createRazorpayOrder({
      email,
      source: TEST_SOURCE,
      reason: TEST_REASON,
      receipt,
      amount: TEST_AMOUNT_PAISE,
      pricingMetadata
    });

    if (razorpayOrder.amount !== TEST_AMOUNT_PAISE || razorpayOrder.currency !== PRO_CURRENCY) {
      throw new Error("Razorpay returned an unexpected test order amount or currency.");
    }

    await createPendingOrder({
      email,
      source: TEST_SOURCE,
      reason: TEST_REASON,
      razorpayOrder,
      receipt,
      metadata: pricingMetadata
    });

    await maybeRecordAuthEvent({
      supabase: rateLimitContext?.supabase,
      request,
      email,
      eventType: "test_payment_order_create",
      success: true,
      metadata: {
        source: TEST_SOURCE,
        providerOrderId: razorpayOrder.id,
        amount: TEST_AMOUNT_PAISE
      }
    });

    console.log("temporary_test_checkout_order_created", {
      recipientEmail: email,
      paymentId: razorpayOrder.id,
      amount: TEST_AMOUNT_PAISE
    });

    return ok({
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: getRazorpayKeyId(),
      test_mode: true,
      paid_price_inr: TEST_PRICE_INR
    });
  } catch (error) {
    await maybeRecordAuthEvent({
      supabase: rateLimitContext?.supabase,
      request,
      email,
      eventType: "test_payment_order_create",
      success: false,
      metadata: { reason: error.code || error.message }
    });
    return fail(error);
  }
}
