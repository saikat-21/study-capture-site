import { createPendingOrder } from "../../../../lib/db";
import { fail, HttpError, ok, readJson } from "../../../../lib/server/errors";
import {
  buildRazorpayReceipt,
  createRazorpayOrder,
  getRazorpayKeyId,
  PRO_AMOUNT,
  PRO_CURRENCY
} from "../../../../lib/server/razorpay";
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
  try {
    const body = await readJson(request);
    const email = normalizeEmail(body.email);
    const source = normalizeSource(body.source);
    const reason = normalizeReason(body.reason);
    const receipt = buildRazorpayReceipt({ email, source });

    const razorpayOrder = await createRazorpayOrder({
      email,
      source,
      reason,
      receipt
    });

    if (razorpayOrder.amount !== PRO_AMOUNT || razorpayOrder.currency !== PRO_CURRENCY) {
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
      receipt
    });

    return ok({
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: getRazorpayKeyId()
    });
  } catch (error) {
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
