import crypto from "crypto";
import { HttpError } from "./errors";

export const PRO_AMOUNT = 79900;
export const PRO_CURRENCY = "INR";

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

export async function createRazorpayOrder({ email, source, reason, receipt }) {
  const keyId = getRazorpayKeyId();
  const keySecret = getRazorpayKeySecret();
  const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      amount: PRO_AMOUNT,
      currency: PRO_CURRENCY,
      receipt,
      notes: {
        product: "Study Capture Pro Lifetime",
        email,
        source,
        reason
      }
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
