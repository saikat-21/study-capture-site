import { activateDeviceForLicense, getLicenseByEmail } from "../../../../lib/db";
import { fail, HttpError, ok, readJson } from "../../../../lib/server/errors";
import { hashDeviceId, signLicenseToken } from "../../../../lib/server/license-token";
import { assertRateLimit, recordAuthEvent } from "../../../../lib/server/rate-limit";
import {
  normalizeEmail,
  normalizeOptionalString,
  normalizeRequiredString
} from "../../../../lib/server/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAID_STATE = "paid_lifetime";

export async function POST(request) {
  let email;
  let rateLimitContext;

  try {
    const body = await readJson(request);
    email = normalizeEmail(body.email);
    const licenseRef = normalizeLicenseRef(body.licenseRef || body.license_ref);
    const deviceId = normalizeRequiredString(body.deviceId, "deviceId", 256);
    const browserName =
      normalizeOptionalString(body.browserName, 80) ||
      normalizeOptionalString(body.browser, 80) ||
      "unknown";
    const os = normalizeOptionalString(body.os, 80) || "unknown";
    const extensionVersion = normalizeOptionalString(body.extensionVersion, 40);

    rateLimitContext = await maybeAssertActivationRateLimit({ request, email });

    const license = await getLicenseByEmail(email);

    if (!license || license.state !== PAID_STATE) {
      throw new HttpError(
        402,
        "license_not_paid",
        "This email does not have an active Study Capture Pro license."
      );
    }

    if (!license.license_ref || license.license_ref !== licenseRef) {
      throw new HttpError(
        401,
        "invalid_license_reference",
        "Enter the license reference from your Study Capture Pro receipt."
      );
    }

    const deviceIdHash = hashDeviceId(deviceId);
    const activation = await activateDeviceForLicense({
      license,
      deviceIdHash,
      browserName,
      os,
      extensionVersion
    });

    if (activation.deviceLimitReached) {
      throw new HttpError(
        409,
        "device_limit_reached",
        `Study Capture Pro supports up to ${activation.maxDevices} active personal browsers/devices.`
      );
    }

    const signedLicense = signLicenseToken({
      email,
      plan: "pro",
      licenseState: license.state,
      licenseId: license.id || license.license_ref,
      licenseRef: license.license_ref,
      deviceIdHash,
      maxDevices: activation.maxDevices
    });

    await maybeRecordActivationEvent({
      rateLimitContext,
      request,
      email,
      success: true,
      metadata: {
        licenseRef,
        browserName,
        os,
        extensionVersion,
        deviceRecordId: activation.device?.id
      }
    });

    return ok({
      message: "Study Capture Pro activated on this device.",
      email,
      plan: "pro",
      licenseState: license.state,
      licenseRef: license.license_ref,
      maxDevices: activation.maxDevices,
      device: activation.device,
      accessToken: signedLicense.token,
      token: signedLicense.token,
      tokenExpiresAt: signedLicense.payload.tokenExpiresAt,
      licenseToken: signedLicense
    });
  } catch (error) {
    await maybeRecordActivationEvent({
      rateLimitContext,
      request,
      email,
      success: false,
      metadata: { reason: error.code || error.message }
    });
    return fail(error);
  }
}

function normalizeLicenseRef(value) {
  const ref = normalizeRequiredString(value, "licenseRef", 40)
    .toUpperCase()
    .replace(/\s+/g, "");

  if (!/^SC-PRO-\d{4}-[A-Z0-9]{6}$/.test(ref)) {
    throw new HttpError(
      400,
      "invalid_license_reference",
      "Enter a valid Study Capture Pro license reference."
    );
  }

  return ref;
}

function hasSupabaseRateLimitStore() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

async function maybeAssertActivationRateLimit({ request, email }) {
  if (!hasSupabaseRateLimitStore()) return null;

  return assertRateLimit({
    request,
    email,
    eventType: "license_activate",
    windowSeconds: 60 * 60,
    emailLimit: 20,
    ipLimit: 80
  });
}

async function maybeRecordActivationEvent({
  rateLimitContext,
  request,
  email,
  success,
  metadata
}) {
  if (!rateLimitContext?.supabase || !email) return;

  await recordAuthEvent({
    supabase: rateLimitContext.supabase,
    request,
    email,
    eventType: "license_activate",
    success,
    metadata
  });
}
