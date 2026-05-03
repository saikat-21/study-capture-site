import crypto from "crypto";
import { HttpError } from "./errors";

/** Single live product: Pro lifetime — ₹499 (INR × 100 paise for Razorpay). */
export const PRO_AMOUNT = 49900;
export const PRO_CURRENCY = "INR";
/** Public paid price shown in UI and receipts (INR, not paise). */
export const PUBLIC_PRICE_INR = 499;
/** Strike / list price for display (INR). */
export const STRIKE_PRICE_INR = 799;

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new HttpError(
      500,
      "configuration_missing",
      `${name} is not configured.`
    );
  }

  return value;
}

/** Razorpay key id must be a live-mode key (`rzp_live_…`). */
function assertLiveKeyId(keyId) {
  const id = typeof keyId === "string" ? keyId.trim() : "";
  if (!id.startsWith("rzp_live_")) {
    throw new HttpError(
      500,
      "invalid_razorpay_key_mode",
      "Only production Razorpay keys (rzp_live_…) are allowed."
    );
  }
}

export function getRazorpayKeyId() {
  const fromPublic =
    typeof process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID === "string"
      ? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID.trim()
      : "";
  const fallback = typeof process.env.RAZORPAY_KEY_ID === "string"
    ? process.env.RAZORPAY_KEY_ID.trim()
    : "";
  const keyId = fromPublic || fallback || requireEnv("RAZORPAY_KEY_ID");
  assertLiveKeyId(keyId);
  return keyId;
}

export function getRazorpayKeySecret() {
  return requireEnv("RAZORPAY_KEY_SECRET");
}

export function getRazorpayWebhookSecret() {
  return requireEnv("RAZORPAY_WEBHOOK_SECRET").trim();
}

export function buildRazorpayReceipt({ email, source }) {
  const emailHash = crypto
    .createHash("sha256")
    .update(email)
    .digest("hex")
    .slice(0, 8);
  const safeSource = String(source || "website").replace(/[^a-z0-9]/gi, "").slice(0, 8);
  const suffix = Date.now().toString(36).slice(-8);

  return `SC-${safeSource}-${emailHash}-${suffix}`.slice(0, 40);
}

/**
 * Authoritative checkout pricing — server-defined only (₹499). No client/query overrides.
 */
export function getCheckoutPricing() {
  return {
    amount: PRO_AMOUNT,
    currency: PRO_CURRENCY,
    publicPriceInr: PUBLIC_PRICE_INR,
    strikePriceInr: STRIKE_PRICE_INR,
    metadata: {
      paid_price_inr: PUBLIC_PRICE_INR,
      original_price_inr: STRIKE_PRICE_INR
    }
  };
}

export async function createRazorpayOrder({
  email,
  source,
  reason,
  receipt,
  amount = PRO_AMOUNT,
  pricingMetadata = {}
}) {
  const keyId = getRazorpayKeyId();
  const keySecret = getRazorpayKeySecret();
  const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const notes = {
    product: "Study Capture Pro Lifetime",
    email,
    source,
    reason
  };

  if (pricingMetadata.original_price_inr != null) {
    notes.original_price_inr = String(pricingMetadata.original_price_inr);
  }
  if (pricingMetadata.paid_price_inr != null) {
    notes.paid_price_inr = String(pricingMetadata.paid_price_inr);
  }

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      amount,
      currency: PRO_CURRENCY,
      receipt,
      notes
    })
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new HttpError(
      502,
      "razorpay_order_failed",
      "Could not create a Razorpay order.",
      data || undefined
    );
  }

  return data;
}

export function signRazorpayPayment({ orderId, paymentId }) {
  return crypto
    .createHmac("sha256", getRazorpayKeySecret())
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
}

export function verifyRazorpayPaymentSignature({
  orderId,
  paymentId,
  signature
}) {
  const expected = signRazorpayPayment({ orderId, paymentId });
  return timingSafeEqual(expected, signature);
}

export function verifyRazorpayWebhookSignature({ rawBody, signature }) {
  const expected = crypto
    .createHmac("sha256", getRazorpayWebhookSecret())
    .update(rawBody)
    .digest("hex");

  return timingSafeEqual(expected, signature);
}

function timingSafeEqual(expected, received) {
  if (!expected || !received) return false;

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);

  if (expectedBuffer.length !== receivedBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}
