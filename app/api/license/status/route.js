import {
  getLicenseByEmail as getDbLicenseByEmail,
  getSubscriptionByEmail,
  listActiveDevicesForLicense
} from "../../../../lib/db";
import { getAuthenticatedUser } from "../../../../lib/server/auth";
import { fail, ok } from "../../../../lib/server/errors";
import { hashDeviceId, verifyLicenseToken } from "../../../../lib/server/license-token";
import {
  ensureProfileForAuthUser,
  getLicenseByEmail as getSupabaseLicenseByEmail,
  licensePlanForState,
  listActiveDevices
} from "../../../../lib/server/licenses";
import { createSupabaseServiceClient } from "../../../../lib/server/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const bearerToken = getBearerTokenOrNull(request);
    const signedPayload = bearerToken ? verifySignedTokenOrNull(bearerToken) : null;

    if (signedPayload) {
      return ok(await getSignedLicenseStatus(signedPayload, bearerToken));
    }

    const auth = await getAuthenticatedUser(request);
    const url = new URL(request.url);
    const deviceId = url.searchParams.get("deviceId");
    const supabase = createSupabaseServiceClient();

    await ensureProfileForAuthUser(supabase, auth.user, auth.email);

    const license = await getSupabaseLicenseByEmail(supabase, auth.email);
    const subscription = await getSubscriptionByEmail(auth.email);
    const licensePlan = licensePlanForState(license?.state);
    const subscriptionActive = !subscription || subscription.status === "active";
    const plan = licensePlan === "pro" && subscriptionActive ? "pro" : "free";
    const maxDevices = license?.max_devices || 3;
    const activeDevices = license ? await listActiveDevices(supabase, license.id) : [];
    let deviceStatus = "not_activated";

    if (license && deviceId) {
      const deviceIdHash = hashDeviceId(deviceId);
      const { data: device } = await supabase
        .from("devices")
        .select("id, deactivated_at")
        .eq("license_id", license.id)
        .eq("device_id_hash", deviceIdHash)
        .order("last_seen_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (device) {
        deviceStatus = device.deactivated_at ? "inactive" : "active";
      }
    }

    return ok({
      email: auth.email,
      plan,
      licenseState: license?.state || "free",
      maxDevices,
      active: plan === "pro",
      licenseActive: plan === "pro",
      status: plan === "pro" ? "active" : "inactive",
      subscriptionStatus: subscription?.status || (plan === "pro" ? "active" : "none"),
      licenseRef: license?.license_ref || null,
      activeDeviceCount: activeDevices.length,
      deviceStatus,
      activeDevices
    });
  } catch (error) {
    return fail(error);
  }
}

async function getSignedLicenseStatus(payload, accessToken) {
  const license = await getDbLicenseByEmail(payload.email);
  const subscription = await getSubscriptionByEmail(payload.email);
  const activeDevices = license ? await listActiveDevicesForLicense(license) : [];
  const licenseIsActive =
    Boolean(license) &&
    license.state === "paid_lifetime" &&
    license.license_ref === payload.licenseRef &&
    (!subscription || subscription.status === "active");
  const deviceIsActive =
    licenseIsActive &&
    activeDevices.some((device) => device.device_id_hash === payload.deviceIdHash);
  const active = licenseIsActive && deviceIsActive;

  return {
    email: payload.email,
    plan: active ? "pro" : "free",
    licenseState: license?.state || "free",
    subscriptionStatus: subscription?.status || "none",
    subscriptionPlan: subscription?.plan || null,
    licenseRef: payload.licenseRef,
    maxDevices: license?.max_devices || payload.maxDevices || 3,
    active,
    licenseActive: active,
    status: active ? "active" : "inactive",
    deviceStatus: deviceIsActive ? "active" : "inactive",
    activeDeviceCount: activeDevices.length,
    tokenExpiresAt: payload.tokenExpiresAt,
    accessToken,
    activeDevices: activeDevices.map((device) => ({
      id: device.id,
      browser_name: device.browser_name,
      os: device.os,
      extension_version: device.extension_version,
      first_seen_at: device.first_seen_at,
      last_seen_at: device.last_seen_at
    }))
  };
}

function getBearerTokenOrNull(request) {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

function verifySignedTokenOrNull(token) {
  try {
    return verifyLicenseToken(token);
  } catch (error) {
    if (error?.code === "configuration_missing") return null;
    throw error;
  }
}
