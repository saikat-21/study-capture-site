import crypto from "crypto";
import { HttpError } from "./errors";

function base64url(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

export function signLicenseToken(payload) {
  const secret = process.env.LICENSE_TOKEN_SECRET;

  if (!secret) {
    throw new HttpError(
      500,
      "configuration_missing",
      "LICENSE_TOKEN_SECRET is not configured on the server."
    );
  }

  const body = {
    version: 1,
    issuedAt: new Date().toISOString(),
    tokenExpiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    ...payload
  };
  const encodedPayload = base64url(body);
  const signature = crypto
    .createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");

  return {
    token: `${encodedPayload}.${signature}`,
    payload: body,
    signature
  };
}

export function verifyLicenseToken(token) {
  const secret = process.env.LICENSE_TOKEN_SECRET;

  if (!secret) {
    throw new HttpError(
      500,
      "configuration_missing",
      "LICENSE_TOKEN_SECRET is not configured on the server."
    );
  }

  if (typeof token !== "string" || !token.includes(".")) return null;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(signature);

  if (
    expectedBuffer.length !== receivedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    if (
      typeof payload.tokenExpiresAt === "number" &&
      payload.tokenExpiresAt <= Date.now()
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function hashDeviceId(deviceId) {
  const secret = process.env.DEVICE_HASH_SECRET || process.env.LICENSE_TOKEN_SECRET;

  if (!secret) {
    throw new HttpError(
      500,
      "configuration_missing",
      "DEVICE_HASH_SECRET or LICENSE_TOKEN_SECRET is not configured on the server."
    );
  }

  return crypto.createHmac("sha256", secret).update(deviceId).digest("hex");
}
