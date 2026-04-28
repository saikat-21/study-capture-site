import { HttpError } from "./errors";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value) {
  if (typeof value !== "string") {
    throw new HttpError(400, "invalid_email", "Enter a valid email address.");
  }

  const email = value.trim().toLowerCase();

  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    throw new HttpError(400, "invalid_email", "Enter a valid email address.");
  }

  return email;
}

export function normalizeOtp(value) {
  if (typeof value !== "string") {
    throw new HttpError(400, "invalid_otp", "Enter the verification code from your email.");
  }

  const otp = value.trim();

  if (!/^\d{6,8}$/.test(otp)) {
    throw new HttpError(400, "invalid_otp", "Enter the verification code from your email.");
  }

  return otp;
}

export function normalizeRequiredString(value, field, maxLength = 160) {
  if (typeof value !== "string") {
    throw new HttpError(400, "invalid_input", `${field} is required.`);
  }

  const text = value.trim();

  if (!text || text.length > maxLength) {
    throw new HttpError(400, "invalid_input", `${field} is invalid.`);
  }

  return text;
}

export function normalizeOptionalString(value, maxLength = 160) {
  if (value == null) return null;
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text) return null;
  return text.slice(0, maxLength);
}
