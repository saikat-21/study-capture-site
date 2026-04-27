import { requireAdminUser } from "../../../../../lib/server/admin";
import { fail, HttpError, ok, readJson } from "../../../../../lib/server/errors";
import { createSupabaseServiceClient } from "../../../../../lib/server/supabase";
import {
  normalizeEmail,
  normalizeOptionalString,
  normalizeRequiredString
} from "../../../../../lib/server/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LICENSE_STATES = new Set([
  "free",
  "paid_lifetime",
  "refunded",
  "chargeback",
  "banned_abuse"
]);

export async function POST(request) {
  try {
    const admin = await requireAdminUser(request);
    const body = await readJson(request);
    const email = body.email ? normalizeEmail(body.email) : null;
    const licenseId = body.licenseId
      ? normalizeRequiredString(body.licenseId, "licenseId", 80)
      : null;
    const state = normalizeRequiredString(body.state, "state", 40);
    const maxDevices =
      body.maxDevices == null ? null : normalizeMaxDevices(body.maxDevices);
    const note = normalizeOptionalString(body.note, 400);

    if (!email && !licenseId) {
      throw new HttpError(400, "missing_license", "Provide an email or license ID.");
    }

    if (!LICENSE_STATES.has(state)) {
      throw new HttpError(400, "invalid_license_state", "Choose a valid license state.");
    }

    const supabase = createSupabaseServiceClient();
    let query = supabase.from("licenses").select("*");
    query = licenseId ? query.eq("id", licenseId) : query.eq("email", email);
    const { data: existing, error: lookupError } = await query.maybeSingle();

    if (lookupError) throw lookupError;
    if (!existing) {
      throw new HttpError(404, "license_not_found", "No license found.");
    }

    const patch = {
      state,
      metadata: {
        ...(existing.metadata || {}),
        lastAdminUpdate: {
          adminEmail: admin.email,
          note,
          state,
          updatedAt: new Date().toISOString()
        }
      }
    };

    if (maxDevices != null) patch.max_devices = maxDevices;
    if (state === "paid_lifetime" && !existing.activated_at) {
      patch.activated_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("licenses")
      .update(patch)
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) throw error;

    await syncSubscriptionState({
      supabase,
      license: data,
      state,
      adminEmail: admin.email,
      note
    });

    await supabase.from("auth_events").insert({
      event_type: "admin_license_update",
      email: data.email,
      success: true,
      metadata: {
        adminEmail: admin.email,
        licenseId: data.id,
        state,
        maxDevices,
        note
      }
    });

    return ok({
      message: "License updated.",
      license: data
    });
  } catch (error) {
    return fail(error);
  }
}

async function syncSubscriptionState({ supabase, license, state, adminEmail, note }) {
  const status = subscriptionStatusForLicenseState(state);
  const now = new Date().toISOString();
  const patch = {
    status,
    ended_at: status === "active" ? null : now,
    metadata: {
      lastAdminUpdate: {
        adminEmail,
        note,
        licenseState: state,
        subscriptionStatus: status,
        updatedAt: now
      }
    }
  };

  const { error } = await supabase
    .from("subscriptions")
    .update(patch)
    .eq("license_id", license.id);

  if (error) throw error;
}

function subscriptionStatusForLicenseState(state) {
  if (state === "paid_lifetime") return "active";
  if (state === "banned_abuse") return "banned_abuse";
  if (state === "chargeback") return "chargeback";
  if (state === "refunded") return "refunded";
  return "free";
}

function normalizeMaxDevices(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 20) {
    throw new HttpError(400, "invalid_max_devices", "Max devices must be between 1 and 20.");
  }
  return parsed;
}
