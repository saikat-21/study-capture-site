import {
  activateDeviceForLicense,
  getLicenseByEmail,
  listActiveDevicesForLicense,
  getSubscriptionByEmail
} from "../../../../lib/db";
import { corsPreflight, withCors } from "../../../../lib/server/cors";
import { fail, HttpError, ok, readJson } from "../../../../lib/server/errors";
import {
  hashDeviceId,
  signLicenseToken,
  verifyActivationGrant
} from "../../../../lib/server/license-token";
import { assertRateLimit, recordAuthEvent } from "../../../../lib/server/rate-limit";
import {
  normalizeEmail,
  normalizeOptionalString,
  normalizeRequiredString
} from "../../../../lib/server/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAID_STATE = "paid_lifetime";

export async function OPTIONS(request) {
  return corsPreflight(request);
}

export async function POST(request) {
  let email;
  let extId;
  let deviceId;
  let deviceIdHash;
  let rateLimitContext;

  try {
    const url = new URL(request.url);
    const body = await readJson(request);
    const activationGrant = normalizeOptionalString(
      body.activationGrant || body.activation_grant || body.grant,
      1200
    );
    const grantPayload = activationGrant ? verifyActivationGrant(activationGrant) : null;

    if (activationGrant && !grantPayload) {
      throw new HttpError(
        401,
        "invalid_activation_grant",
        "Your activation session expired. Verify your email again."
      );
    }

    email = grantPayload?.email
      ? normalizeEmail(grantPayload.email)
      : normalizeEmail(body.email);
    const requestedEmail = body.email ? normalizeEmail(body.email) : email;
    if (requestedEmail !== email) {
      throw new HttpError(
        403,
        "activation_email_mismatch",
        "Activation email does not match this verified session."
      );
    }
    const legacyLicenseRef = normalizeOptionalLicenseRef(body.licenseRef || body.license_ref);
    deviceId = normalizeRequiredString(
      body.deviceId || body.device_id || body.deviceID,
      "deviceId",
      256
    );
    extId =
      normalizeOptionalString(body.extId || body.extensionId || url.searchParams.get("extId"), 160) ||
      null;
    const browserName =
      normalizeOptionalString(body.browserName, 80) ||
      normalizeOptionalString(body.browser, 80) ||
      "unknown";
    const os = normalizeOptionalString(body.os, 80) || "unknown";
    const extensionVersion = normalizeOptionalString(body.extensionVersion, 40);

    rateLimitContext = await maybeAssertActivationRateLimit({ request, email });

    const license = await getLicenseByEmail(email);
    const subscription = await getSubscriptionByEmail(email);
    const activeDevices = license ? await listActiveDevicesForLicense(license) : [];

    console.log("Study Capture license activation lookup.", {
      email,
      extId,
      licenseFound: Boolean(license),
      licenseId: license?.id || null,
      licenseState: license?.state || null,
      maxDevices: license?.max_devices || null,
      subscriptionStatus: subscription?.status || null,
      activeDeviceCount: activeDevices.length
    });

    if (
      !license ||
      license.state !== PAID_STATE ||
      (subscription && subscription.status !== "active")
    ) {
      throw new HttpError(
        402,
        "license_not_paid",
        "This email does not have an active Study Capture Pro license."
      );
    }

    if (grantPayload?.licenseId && license.id && grantPayload.licenseId !== license.id) {
      throw new HttpError(
        403,
        "activation_license_mismatch",
        "Activation session does not match this license."
      );
    }

    if (!grantPayload && (!legacyLicenseRef || license.license_ref !== legacyLicenseRef)) {
      throw new HttpError(
        401,
        "invalid_license_reference",
        "Verify your email on the Study Capture website to activate Pro."
      );
    }

    deviceIdHash = hashDeviceId(deviceId);
    console.log("Study Capture license activation device context.", {
      email,
      extId,
      deviceId,
      deviceIdHash,
      browserName,
      os,
      extensionVersion
    });

    const activation = await activateDeviceForLicense({
      license,
      deviceIdHash,
      browserName,
      os,
      extensionVersion
    });

    console.log("Study Capture license activation device DB result.", {
      email,
      extId,
      operation: activation.operation || null,
      deviceLimitReached: Boolean(activation.deviceLimitReached),
      maxDevices: activation.maxDevices,
      activeDeviceCountBeforeInsert: activation.activeDeviceCount ?? activeDevices.length,
      deviceRecordId: activation.device?.id || null,
      browserName: activation.device?.browser_name || null,
      os: activation.device?.os || null,
      lastSeenAt: activation.device?.last_seen_at || null
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
      deviceIdHash,
      maxDevices: activation.maxDevices
    });

    console.log("Study Capture license activation token generated.", {
      email,
      extId,
      licenseId: license.id || license.license_ref || null,
      deviceRecordId: activation.device?.id || null,
      tokenExpiresAt: signedLicense.payload.tokenExpiresAt
    });

    await maybeRecordActivationEvent({
      rateLimitContext,
      request,
      email,
      success: true,
      metadata: {
        licenseId: license.id || null,
        legacyLicenseReferenceUsed: Boolean(!grantPayload && legacyLicenseRef),
        browserName,
        os,
        extensionVersion,
        deviceRecordId: activation.device?.id
      }
    });

    return withCors(request, ok({
      message: "Study Capture Pro activated on this device.",
      email,
      plan: "pro",
      licenseState: license.state,
      subscriptionStatus: subscription?.status || "active",
      maxDevices: activation.maxDevices,
      activeDeviceCount: activeDeviceCountAfterActivation(activeDevices.length, activation),
      device: activation.device,
      accessToken: signedLicense.token,
      token: signedLicense.token,
      tokenExpiresAt: signedLicense.payload.tokenExpiresAt,
      licenseToken: signedLicense
    }));
  } catch (error) {
    console.error("Study Capture license activation failed.", {
      email: email || null,
      extId: extId || null,
      deviceId: deviceId || null,
      deviceIdHash: deviceIdHash || null,
      code: error?.code || null,
      message: error?.message || String(error)
    });
    await maybeRecordActivationEvent({
      rateLimitContext,
      request,
      email,
      success: false,
      metadata: { reason: error.code || error.message }
    });
    return withCors(request, fail(error));
  }
}

function activeDeviceCountAfterActivation(currentCount, activation) {
  if (activation.operation === "insert_new_device" || activation.operation === "reactivate_existing_device") {
    return currentCount + 1;
  }

  return currentCount;
}

function normalizeOptionalLicenseRef(value) {
  if (value == null) return null;
  const ref = normalizeRequiredString(value, "licenseRef", 40)
    .toUpperCase()
    .replace(/\s+/g, "");

  if (!/^SC-PRO-\d{4}-[A-Z0-9]{6}$/.test(ref)) {
    throw new HttpError(
      400,
      "invalid_license_reference",
      "Verify your email on the Study Capture website to activate Pro."
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
