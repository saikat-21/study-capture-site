import { HttpError } from "./errors";
import { hashDeviceId, signLicenseToken } from "./license-token";

const DEFAULT_MAX_DEVICES = 3;
const PAID_STATE = "paid_lifetime";

export function licensePlanForState(state) {
  return state === PAID_STATE ? "pro" : "free";
}

export async function ensureProfileForAuthUser(supabase, authUser, normalizedEmail) {
  const { data: existing, error: selectError } = await supabase
    .from("users")
    .select("id, auth_user_id, email")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (selectError) {
    throw new HttpError(500, "profile_lookup_failed", "Could not load your account.");
  }

  if (existing) {
    if (!existing.auth_user_id || existing.auth_user_id !== authUser.id) {
      const { data, error } = await supabase
        .from("users")
        .update({ auth_user_id: authUser.id, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .select("id, auth_user_id, email")
        .single();

      if (error) {
        throw new HttpError(500, "profile_update_failed", "Could not update your account.");
      }

      return data;
    }

    return existing;
  }

  const { data, error } = await supabase
    .from("users")
    .insert({ auth_user_id: authUser.id, email: normalizedEmail })
    .select("id, auth_user_id, email")
    .single();

  if (error) {
    throw new HttpError(500, "profile_create_failed", "Could not create your account.");
  }

  return data;
}

export async function getLicenseByEmail(supabase, email) {
  const { data, error } = await supabase
    .from("licenses")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, "license_lookup_failed", "Could not load your license.");
  }

  return data;
}

export async function getActiveDeviceCount(supabase, licenseId) {
  const { count, error } = await supabase
    .from("devices")
    .select("id", { count: "exact", head: true })
    .eq("license_id", licenseId)
    .is("deactivated_at", null);

  if (error) {
    throw new HttpError(500, "device_count_failed", "Could not check device limit.");
  }

  return count || 0;
}

export async function listActiveDevices(supabase, licenseId) {
  const { data, error } = await supabase
    .from("devices")
    .select("id, browser_name, os, extension_version, first_seen_at, last_seen_at")
    .eq("license_id", licenseId)
    .is("deactivated_at", null)
    .order("last_seen_at", { ascending: false });

  if (error) {
    throw new HttpError(500, "device_list_failed", "Could not load devices.");
  }

  return data || [];
}

export async function activateLicenseDevice({
  supabase,
  email,
  profile,
  license,
  deviceId,
  browserName,
  os,
  extensionVersion
}) {
  if (!license || license.state !== PAID_STATE) {
    throw new HttpError(
      402,
      "license_not_paid",
      "This email does not have an active Study Capture Pro license."
    );
  }

  const maxDevices = license.max_devices || DEFAULT_MAX_DEVICES;
  const deviceIdHash = hashDeviceId(deviceId);
  const now = new Date().toISOString();

  const { data: existingDevices, error: existingError } = await supabase
    .from("devices")
    .select("*")
    .eq("license_id", license.id)
    .eq("device_id_hash", deviceIdHash)
    .order("last_seen_at", { ascending: false })
    .limit(1);

  if (existingError) {
    throw new HttpError(500, "device_lookup_failed", "Could not check this device.");
  }

  const existingDevice = existingDevices?.[0] || null;

  if (existingDevice?.deactivated_at == null) {
    const { data, error } = await supabase
      .from("devices")
      .update({
        browser_name: browserName,
        os,
        extension_version: extensionVersion,
        last_seen_at: now,
        updated_at: now
      })
      .eq("id", existingDevice.id)
      .select("id, browser_name, os, extension_version, first_seen_at, last_seen_at")
      .single();

    if (error) {
      throw new HttpError(500, "device_refresh_failed", "Could not refresh this device.");
    }

    return buildActivationResponse({ email, license, maxDevices, deviceIdHash, device: data });
  }

  const activeCount = await getActiveDeviceCount(supabase, license.id);

  if (activeCount >= maxDevices) {
    throw new HttpError(
      409,
      "device_limit_reached",
      `Study Capture Pro supports up to ${maxDevices} active personal browsers/devices.`
    );
  }

  if (existingDevice) {
    const { data, error } = await supabase
      .from("devices")
      .update({
        user_id: profile.id,
        browser_name: browserName,
        os,
        extension_version: extensionVersion,
        deactivated_at: null,
        last_seen_at: now,
        updated_at: now
      })
      .eq("id", existingDevice.id)
      .select("id, browser_name, os, extension_version, first_seen_at, last_seen_at")
      .single();

    if (error) {
      throw new HttpError(500, "device_reactivate_failed", "Could not reactivate this device.");
    }

    return buildActivationResponse({ email, license, maxDevices, deviceIdHash, device: data });
  }

  const { data, error } = await supabase
    .from("devices")
    .insert({
      license_id: license.id,
      user_id: profile.id,
      device_id_hash: deviceIdHash,
      browser_name: browserName,
      os,
      extension_version: extensionVersion,
      first_seen_at: now,
      last_seen_at: now
    })
    .select("id, browser_name, os, extension_version, first_seen_at, last_seen_at")
    .single();

  if (error) {
    throw new HttpError(500, "device_activation_failed", "Could not activate this device.");
  }

  await supabase.from("auth_events").insert({
    event_type: "device_activated",
    email,
    success: true,
    metadata: {
      licenseId: license.id,
      deviceRecordId: data.id,
      browserName,
      os,
      extensionVersion
    }
  });

  return buildActivationResponse({ email, license, maxDevices, deviceIdHash, device: data });
}

function buildActivationResponse({ email, license, maxDevices, deviceIdHash, device }) {
  const signedLicense = signLicenseToken({
    email,
    plan: "pro",
    licenseState: license.state,
    licenseId: license.id,
    deviceIdHash,
    maxDevices
  });

  return {
    plan: "pro",
    licenseState: license.state,
    maxDevices,
    device,
    licenseToken: signedLicense
  };
}
