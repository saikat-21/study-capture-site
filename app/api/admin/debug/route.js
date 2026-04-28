import { requireAdminUser } from "../../../../lib/server/admin";
import { fail, ok } from "../../../../lib/server/errors";
import { createSupabaseServiceClient } from "../../../../lib/server/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const admin = await requireAdminUser(request);
    const supabase = createSupabaseServiceClient();

    const [
      recentPayments,
      recentLicenses,
      recentDeviceActivations,
      recentActivationEvents
    ] = await Promise.all([
      selectRows(
        supabase,
        "payments",
        "id,email,provider,provider_order_id,provider_payment_id,provider_event_id,amount,currency,status,source,reason,receipt,paid_at,created_at,updated_at,licenses(license_ref,state)",
        (query) => query.order("created_at", { ascending: false }).limit(50)
      ),
      selectRows(
        supabase,
        "licenses",
        "id,email,license_ref,state,max_devices,activated_at,created_at,updated_at,subscriptions(plan,status,provider_payment_id,lifetime_access)",
        (query) => query.order("updated_at", { ascending: false }).limit(50)
      ),
      selectRows(
        supabase,
        "devices",
        "id,browser_name,os,extension_version,first_seen_at,last_seen_at,deactivated_at,licenses(email,license_ref,state)",
        (query) => query.order("last_seen_at", { ascending: false }).limit(50)
      ),
      selectRows(
        supabase,
        "auth_events",
        "id,event_type,email,success,user_agent,metadata,created_at",
        (query) =>
          query
            .in("event_type", ["license_activate", "device_activated", "device_deactivate"])
            .order("created_at", { ascending: false })
            .limit(50)
      )
    ]);

    return ok({
      adminEmail: admin.email,
      generatedAt: new Date().toISOString(),
      recentPayments,
      recentLicenses,
      recentDeviceActivations,
      recentActivationEvents
    });
  } catch (error) {
    return fail(error);
  }
}

async function selectRows(supabase, table, columns, refine = null) {
  let query = supabase.from(table).select(columns);
  if (refine) query = refine(query);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
