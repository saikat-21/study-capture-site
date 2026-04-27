import { getAuthenticatedUser } from "../../../../lib/server/auth";
import { fail, HttpError, ok, readJson } from "../../../../lib/server/errors";
import {
  ensureProfileForAuthUser,
  getLicenseByEmail,
  getActiveDeviceCount
} from "../../../../lib/server/licenses";
import { hashDeviceId } from "../../../../lib/server/license-token";
import { assertRateLimit, recordAuthEvent } from "../../../../lib/server/rate-limit";
import { createSupabaseServiceClient } from "../../../../lib/server/supabase";
import { normalizeRequiredString } from "../../../../lib/server/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  let email;
  let rateLimitContext;

  try {
    const auth = await getAuthenticatedUser(request);
    email = auth.email;
    const body = await readJson(request);

    rateLimitContext = await assertRateLimit({
      request,
      email,
      eventType: "device_deactivate",
      windowSeconds: 60 * 60,
      emailLimit: 30,
      ipLimit: 100
    });

    const supabase = createSupabaseServiceClient();
    await ensureProfileForAuthUser(supabase, auth.user, email);
    const license = await getLicenseByEmail(supabase, email);

    if (!license) {
      throw new HttpError(404, "license_not_found", "No license found for this email.");
    }

    let query = supabase
      .from("devices")
      .update({ deactivated_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("license_id", license.id)
      .is("deactivated_at", null);

    if (body.deviceRecordId) {
      query = query.eq("id", normalizeRequiredString(body.deviceRecordId, "deviceRecordId", 80));
    } else if (body.deviceId) {
      query = query.eq("device_id_hash", hashDeviceId(normalizeRequiredString(body.deviceId, "deviceId", 256)));
    } else {
      throw new HttpError(400, "missing_device", "Choose a device to remove.");
    }

    const { data, error } = await query.select("id").maybeSingle();

    if (error) {
      throw new HttpError(500, "device_remove_failed", "Could not remove this device.");
    }

    if (!data) {
      throw new HttpError(404, "device_not_found", "Device not found or already removed.");
    }

    await recordAuthEvent({
      supabase: rateLimitContext.supabase,
      request,
      email,
      eventType: "device_deactivate",
      success: true,
      metadata: { deviceRecordId: data.id }
    });

    const activeDeviceCount = await getActiveDeviceCount(supabase, license.id);

    return ok({
      message: "Device removed.",
      deviceRecordId: data.id,
      activeDeviceCount
    });
  } catch (error) {
    if (email && rateLimitContext?.supabase) {
      await recordAuthEvent({
        supabase: rateLimitContext.supabase,
        request,
        email,
        eventType: "device_deactivate",
        success: false,
        metadata: { reason: error.code || error.message }
      });
    }

    return fail(error);
  }
}
