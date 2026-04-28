import { ok } from "../../../../lib/server/errors";
import { resolveCheckoutPricing } from "../../../../lib/server/razorpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const pricing = resolveCheckoutPricing({
    testMode: searchParams.get("test"),
    testToken: searchParams.get("token")
  });

  return ok({
    amount: pricing.amount,
    currency: pricing.currency,
    test_mode: pricing.testMode,
    public_price_inr: pricing.publicPriceInr,
    original_price_inr: pricing.originalPriceInr,
    paid_price_inr: pricing.paidPriceInr
  });
}
