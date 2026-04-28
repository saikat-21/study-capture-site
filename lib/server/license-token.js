import crypto from "crypto";
import { HttpError } from "./errors";

function base64url(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function signPayload(payload) {
  const secret = process.env.LICENSE_TOKEN_SECRET;

  if (!secret) {
    throw new HttpError(
      500,
      "configuration_missing",
      "LICENSE_TOKEN_SECRET is not configured on the server."
    );
  }

  const encodedPayload = base64url(payload);
  const signature = crypto
    .createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");

  return {
    token: `${encodedPayload}.${signature}`,
    payload,
    signature
  };
}

function verifySignedPayload(token) {
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
    return JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export function signLicenseToken(payload) {
  const body = {
    version: 1,
    purpose: "device_license",
    issuedAt: new Date().toISOString(),
    tokenExpiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    ...payload
  };
  return signPayload(body);
}

export function verifyLicenseToken(token) {
  const payload = verifySignedPayload(token);
  if (!payload) return null;
  if (payload.purpose && payload.purpose !== "device_license") return null;
  if (
    typeof payload.tokenExpiresAt === "number" &&
    payload.tokenExpiresAt <= Date.now()
  ) {
    return null;
  }
  return payload;
}

export function signActivationGrant(payload) {
  const now = Date.now();
  const body = {
    version: 1,
    purpose: "extension_activation",
    issuedAt: new Date(now).toISOString(),
    activationGrantExpiresAt: now + 10 * 60 * 1000,
    ...payload
  };
  return signPayload(body);
}

export function verifyActivationGrant(token) {
  const payload = verifySignedPayload(token);
  if (!payload) return null;
  if (payload.purpose !== "extension_activation") return null;
  if (
    typeof payload.activationGrantExpiresAt !== "number" ||
    payload.activationGrantExpiresAt <= Date.now()
  ) {
    return null;
  }
  if (typeof payload.email !== "string" || !payload.email) return null;
  return payload;
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
