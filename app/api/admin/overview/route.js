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
      usersCount,
      paidPaymentsCount,
      pendingPaymentsCount,
      proLicensesCount,
      activeDevicesCount,
      revenueRows,
      licenseStateRows,
      recentPayments,
      recentLicenses,
      recentDevices
    ] = await Promise.all([
      countRows(supabase, "users"),
      countRows(supabase, "payments", (query) => query.eq("status", "paid")),
      countRows(supabase, "payments", (query) => query.eq("status", "pending")),
      countRows(supabase, "licenses", (query) => query.eq("state", "paid_lifetime")),
      countRows(supabase, "devices", (query) => query.is("deactivated_at", null)),
      selectRows(supabase, "payments", "amount,currency", (query) =>
        query.eq("status", "paid").limit(1000)
      ),
      selectRows(supabase, "licenses", "state", (query) => query.limit(1000)),
      selectRows(
        supabase,
        "payments",
        "id,email,provider,provider_order_id,provider_payment_id,amount,currency,status,source,reason,created_at,paid_at",
        (query) => query.order("created_at", { ascending: false }).limit(20)
      ),
      selectRows(
        supabase,
        "licenses",
        "id,email,license_ref,state,max_devices,activated_at,created_at,updated_at",
        (query) => query.order("updated_at", { ascending: false }).limit(20)
      ),
      selectRows(
        supabase,
        "devices",
        "id,browser_name,os,extension_version,last_seen_at,deactivated_at,licenses(email,license_ref,state)",
        (query) => query.order("last_seen_at", { ascending: false }).limit(20)
      )
    ]);

    return ok({
      adminEmail: admin.email,
      metrics: {
        users: usersCount,
        paidPayments: paidPaymentsCount,
        pendingPayments: pendingPaymentsCount,
        proLicenses: proLicensesCount,
        activeDevices: activeDevicesCount,
        grossRevenue: sumRevenue(revenueRows),
        licenseStates: countLicenseStates(licenseStateRows)
      },
      recentPayments,
      recentLicenses,
      recentDevices
    });
  } catch (error) {
    return fail(error);
  }
}

async function countRows(supabase, table, refine = null) {
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  if (refine) query = refine(query);
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

async function selectRows(supabase, table, columns, refine = null) {
  let query = supabase.from(table).select(columns);
  if (refine) query = refine(query);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

function sumRevenue(payments) {
  return payments.reduce(
    (total, payment) => {
      const amount = Number(payment.amount);
      return total + (Number.isFinite(amount) ? amount : 0);
    },
    0
  );
}

function countLicenseStates(licenses) {
  return licenses.reduce((states, license) => {
    const state = license.state || "unknown";
    states[state] = (states[state] || 0) + 1;
    return states;
  }, {});
}
