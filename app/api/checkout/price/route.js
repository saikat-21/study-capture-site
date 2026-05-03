import { ok } from "../../../../lib/server/errors";
import { getCheckoutPricing } from "../../../../lib/server/razorpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const pricing = getCheckoutPricing();

  return ok({
    amount: pricing.amount,
    currency: pricing.currency,
    public_price_inr: pricing.publicPriceInr,
    strike_price_inr: pricing.strikePriceInr
  });
}
