import crypto from "crypto";
import { HttpError } from "./errors";

export const PRO_AMOUNT = 49900;
export const PRO_CURRENCY = "INR";
export const DEFAULT_PUBLIC_PRICE_INR = 499;
export const DEFAULT_ORIGINAL_PRICE_INR = 799;
export const DEFAULT_TEST_PRICE_INR = 1;

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

export function getRazorpayKeyId() {
  return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || requireEnv("RAZORPAY_KEY_ID");
}

export function getRazorpayKeySecret() {
  return requireEnv("RAZORPAY_KEY_SECRET");
}

export function getRazorpayWebhookSecret() {
  return requireEnv("RAZORPAY_WEBHOOK_SECRET");
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

export function resolveCheckoutPricing({ testMode, testToken } = {}) {
  const publicPriceInr = readPositiveIntegerEnv(
    "PUBLIC_PRICE_INR",
    DEFAULT_PUBLIC_PRICE_INR
  );
  const originalPriceInr = readPositiveIntegerEnv(
    "ORIGINAL_PRICE_INR",
    DEFAULT_ORIGINAL_PRICE_INR
  );
  const testPriceInr = readPositiveIntegerEnv(
    "TEST_PRICE_INR",
    DEFAULT_TEST_PRICE_INR
  );
  const configuredToken = String(process.env.FOUNDER_TEST_TOKEN || "").trim();
  const requestedMode = String(testMode || "").trim().toLowerCase();
  const requestedByFlag =
    requestedMode === "1" ||
    requestedMode === "true" ||
    requestedMode === "yes";
  const legacyToken = requestedByFlag ? "" : String(testMode || "").trim();
  const providedToken = String(testToken || legacyToken || "").trim();
  const validTestMode =
    String(process.env.ENABLE_INTERNAL_TEST_PAYMENTS || "").trim().toLowerCase() === "true" &&
    (requestedByFlag || Boolean(legacyToken)) &&
    Boolean(configuredToken) &&
    Boolean(providedToken) &&
    timingSafeEqual(configuredToken, providedToken);
  const paidPriceInr = validTestMode ? testPriceInr : publicPriceInr;

  return {
    testMode: validTestMode,
    amount: paidPriceInr * 100,
    currency: PRO_CURRENCY,
    publicPriceInr,
    originalPriceInr,
    paidPriceInr,
    metadata: {
      test_mode: validTestMode,
      original_price_inr: originalPriceInr,
      paid_price_inr: paidPriceInr
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

  if (pricingMetadata.test_mode) {
    notes.test_mode = "true";
    notes.original_source = pricingMetadata.original_source || source;
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

function readPositiveIntegerEnv(name, fallback) {
  const rawValue = process.env[name];
  if (!rawValue) return fallback;

  const value = Number.parseInt(rawValue, 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
