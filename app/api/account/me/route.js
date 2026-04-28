import { getAuthenticatedUser } from "../../../../lib/server/auth";
import { fail, ok } from "../../../../lib/server/errors";
import {
  ensureProfileForAuthUser,
  getLicenseByEmail,
  licensePlanForState,
  listActiveDevices
} from "../../../../lib/server/licenses";
import { createSupabaseServiceClient } from "../../../../lib/server/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const auth = await getAuthenticatedUser(request);
    const supabase = createSupabaseServiceClient();
    const profile = await ensureProfileForAuthUser(supabase, auth.user, auth.email);
    const license = await getLicenseByEmail(supabase, auth.email);

    const [subscription, payments, activeDevices] = await Promise.all([
      getSubscription(supabase, auth.email),
      getPayments(supabase, auth.email),
      license ? listActiveDevices(supabase, license.id) : []
    ]);

    return ok({
      email: auth.email,
      user: profile,
      plan: licensePlanForState(license?.state),
      licenseState: license?.state || "free",
      license: license
        ? {
            id: license.id,
            email: license.email,
            state: license.state,
            max_devices: license.max_devices,
            activated_at: license.activated_at,
            expires_at: license.expires_at,
            created_at: license.created_at,
            updated_at: license.updated_at
          }
        : null,
      subscription,
      payments,
      activeDevices,
      activeDeviceCount: activeDevices.length,
      maxDevices: license?.max_devices || 3
    });
  } catch (error) {
    return fail(error);
  }
}

async function getSubscription(supabase, email) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("email", email)
    .eq("plan", "pro_lifetime")
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

async function getPayments(supabase, email) {
  const { data, error } = await supabase
    .from("payments")
    .select("id,provider,provider_order_id,provider_payment_id,amount,currency,status,source,reason,paid_at,created_at")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return data || [];
}
