import crypto from "crypto";
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
const ROUTE_LOG_PREFIX = "Study Capture license activation";

export async function OPTIONS(request) {
  return corsPreflight(request);
}

export async function POST(request) {
  let email;
  let extId;
  let deviceId;
  let deviceIdHash;
  let activationGrantLength = 0;
  let grantPayload = null;
  let rateLimitContext;

  try {
    const url = new URL(request.url);
    const body = await readJson(request);
    const activationGrant = normalizeOptionalString(
      body.activationGrant || body.activation_grant || body.grant || body.token,
      1200
    );
    activationGrantLength = activationGrant?.length || 0;
    grantPayload = activationGrant ? verifyActivationGrant(activationGrant) : null;

    console.log(`${ROUTE_LOG_PREFIX}: request received`, {
      hasEmail: Boolean(body.email),
      emailHash: body.email ? hashForLog(String(body.email).trim().toLowerCase()) : null,
      hasActivationGrant: Boolean(activationGrant),
      activationGrantLength,
      bodyKeys: Object.keys(body || {}).sort()
    });

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

    console.log(`${ROUTE_LOG_PREFIX}: license lookup result`, {
      email,
      emailHash: hashForLog(email),
      extId,
      licenseFound: Boolean(license),
      licenseId: license?.id || null,
      licenseState: license?.state || null,
      maxDevices: license?.max_devices || null,
      subscriptionStatus: subscription?.status || null,
      activeDeviceCount: activeDevices.length
    });

    if (
      !license
    ) {
      throw new HttpError(
        404,
        "license_not_found",
        "No active Study Capture Pro license was found for this email."
      );
    }

    if (license.state !== PAID_STATE || (subscription && subscription.status !== "active")) {
      throw new HttpError(
        402,
        "license_not_active",
        "This email does not have an active Study Capture Pro license.",
        {
          licenseState: license.state,
          subscriptionStatus: subscription?.status || "none"
        }
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
    console.log(`${ROUTE_LOG_PREFIX}: device context`, {
      email,
      emailHash: hashForLog(email),
      extId,
      deviceId,
      deviceIdHash,
      browserName,
      os,
      extensionVersion
    });

    const activation = await activateDeviceForLicense({
      license,
      email,
      deviceIdHash,
      browserName,
      os,
      extensionVersion
    });

    console.log(`${ROUTE_LOG_PREFIX}: device DB result`, {
      email,
      emailHash: hashForLog(email),
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
        `Study Capture Pro supports up to ${activation.maxDevices} active personal browsers/devices.`,
        {
          activeDevices: activation.activeDeviceCount ?? activeDevices.length,
          maxDevices: activation.maxDevices
        }
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

    const activeDeviceCount = activeDeviceCountAfterActivation(activeDevices.length, activation);

    console.log(`${ROUTE_LOG_PREFIX}: signed token created`, {
      email,
      emailHash: hashForLog(email),
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

    console.log(`${ROUTE_LOG_PREFIX}: completed`, {
      email,
      emailHash: hashForLog(email),
      extId,
      deviceId,
      deviceIdHash,
      planStatus: "pro",
      activeDevices: activeDeviceCount,
      maxDevices: activation.maxDevices
    });

    return withCors(request, ok({
      message: "Study Capture Pro activated on this device.",
      email,
      deviceId,
      planStatus: "pro",
      plan: "pro",
      licenseState: license.state,
      subscriptionStatus: subscription?.status || "active",
      maxDevices: activation.maxDevices,
      activeDevices: activeDeviceCount,
      activeDeviceCount,
      device: activation.device,
      accessToken: signedLicense.token,
      token: signedLicense.token,
      tokenExpiresAt: signedLicense.payload.tokenExpiresAt,
      licenseToken: signedLicense
    }));
  } catch (error) {
    const responseError = normalizeActivationError(error);

    console.error(`${ROUTE_LOG_PREFIX}: failed`, {
      email: email || null,
      emailHash: email ? hashForLog(email) : null,
      extId: extId || null,
      deviceId: deviceId || null,
      deviceIdHash: deviceIdHash || null,
      hasActivationGrant: activationGrantLength > 0,
      activationGrantLength,
      grantEmailHash: grantPayload?.email ? hashForLog(grantPayload.email) : null,
      code: responseError?.code || error?.code || null,
      message: error?.message || String(error),
      stack: error?.stack || null,
      supabaseCode: error?.code || null,
      supabaseDetails: error?.details || null,
      supabaseHint: error?.hint || null
    });

    await maybeRecordActivationEvent({
      rateLimitContext,
      request,
      email,
      success: false,
      metadata: { reason: responseError.code || error.code || error.message }
    });
    return withCors(request, fail(responseError));
  }
}

function activeDeviceCountAfterActivation(currentCount, activation) {
  if (activation.operation === "insert_new_device" || activation.operation === "reactivate_existing_device") {
    return currentCount + 1;
  }

  return currentCount;
}

function normalizeActivationError(error) {
  if (error instanceof HttpError) return error;

  const rawCode = String(error?.code || "");
  if (rawCode === "23505") {
    return new HttpError(
      409,
      "device_activation_conflict",
      "This device activation was already processed. Please try Activate Pro again."
    );
  }

  return new HttpError(
    500,
    "device_activation_failed",
    "Could not activate Study Capture Pro on this device."
  );
}

function hashForLog(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 16);
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
