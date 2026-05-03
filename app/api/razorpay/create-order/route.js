import {
  createPendingOrder,
  getLicenseByEmail,
  getSubscriptionByEmail
} from "../../../../lib/db";
import { fail, HttpError, ok, readJson } from "../../../../lib/server/errors";
import {
  buildRazorpayReceipt,
  createRazorpayOrder,
  getCheckoutPricing,
  getRazorpayKeyId,
  PRO_CURRENCY
} from "../../../../lib/server/razorpay";
import { maybeAssertRateLimit, maybeRecordAuthEvent } from "../../../../lib/server/rate-limit";
import { normalizeEmail, normalizeOptionalString } from "../../../../lib/server/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_SOURCES = new Set(["extension", "website"]);
const ALLOWED_REASONS = new Set([
  "pdf_limit",
  "book_limit",
  "reading_capture",
  "auto_scroll"
]);

export async function POST(request) {
  let email;
  let rateLimitContext;

  try {
    const body = await readJson(request);
    email = normalizeEmail(body.email);
    const source = normalizeSource(body.source);
    const reason = normalizeReason(body.reason);
    const pricing = getCheckoutPricing();
    const pricingMetadata = {
      ...pricing.metadata,
      source
    };
    rateLimitContext = await maybeAssertRateLimit({
      request,
      email,
      eventType: "payment_order_create",
      windowSeconds: 60 * 60,
      emailLimit: 12,
      ipLimit: 50
    });

    const [existingLicense, existingSubscription] = await Promise.all([
      getLicenseByEmail(email),
      getSubscriptionByEmail(email)
    ]);

    if (
      existingLicense?.state === "paid_lifetime" &&
      (!existingSubscription || existingSubscription.status === "active")
    ) {
      throw new HttpError(
        409,
        "already_pro",
        "This email already has Study Capture Pro active. Use the same email to restore Pro.",
        {
          email
        }
      );
    }

    const receipt = buildRazorpayReceipt({ email, source });

    const razorpayOrder = await createRazorpayOrder({
      email,
      source,
      reason,
      receipt,
      amount: pricing.amount,
      pricingMetadata
    });

    if (razorpayOrder.amount !== pricing.amount || razorpayOrder.currency !== PRO_CURRENCY) {
      throw new HttpError(
        502,
        "razorpay_order_mismatch",
        "Razorpay returned an unexpected order amount or currency."
      );
    }

    await createPendingOrder({
      email,
      source,
      reason,
      razorpayOrder,
      receipt,
      metadata: pricingMetadata
    });

    await maybeRecordAuthEvent({
      supabase: rateLimitContext?.supabase,
      request,
      email,
      eventType: "payment_order_create",
      success: true,
      metadata: {
        source,
        reason,
        providerOrderId: razorpayOrder.id
      }
    });

    return ok({
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: getRazorpayKeyId(),
      public_price_inr: pricing.publicPriceInr,
      strike_price_inr: pricing.strikePriceInr
    });
  } catch (error) {
    await maybeRecordAuthEvent({
      supabase: rateLimitContext?.supabase,
      request,
      email,
      eventType: "payment_order_create",
      success: false,
      metadata: { reason: error.code || error.message }
    });
    return fail(error);
  }
}

function normalizeSource(value) {
  const source = normalizeOptionalString(value, 40) || "website";
  return ALLOWED_SOURCES.has(source) ? source : "website";
}

function normalizeReason(value) {
  const reason = normalizeOptionalString(value, 60) || "direct";
  return ALLOWED_REASONS.has(reason) ? reason : "direct";
}
