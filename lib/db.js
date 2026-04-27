import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const PRODUCT_AMOUNT = 79900;
const PRODUCT_CURRENCY = "INR";
const PRODUCT_PROVIDER = "razorpay";

function getMemoryStore() {
  if (!globalThis.__studyCaptureMockDb) {
    globalThis.__studyCaptureMockDb = {
      orders: new Map(),
      payments: new Map(),
      licenses: new Map(),
      devices: new Map(),
      webhookEvents: new Set()
    };
  }

  return globalThis.__studyCaptureMockDb;
}

function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function getSupabase() {
  if (!hasSupabaseConfig()) return null;

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  );
}

export function createLicenseReference(date = new Date()) {
  const year = date.getFullYear();
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `SC-PRO-${year}-${suffix}`;
}

export async function createPendingOrder({
  email,
  source,
  reason,
  razorpayOrder,
  receipt
}) {
  const record = {
    email,
    source,
    reason,
    provider: PRODUCT_PROVIDER,
    provider_order_id: razorpayOrder.id,
    receipt,
    amount: razorpayOrder.amount || PRODUCT_AMOUNT,
    currency: razorpayOrder.currency || PRODUCT_CURRENCY,
    status: "pending",
    raw_event: razorpayOrder,
    created_at: new Date().toISOString()
  };

  const supabase = getSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from("payments")
      .upsert(
        {
          email,
          provider: PRODUCT_PROVIDER,
          provider_order_id: record.provider_order_id,
          provider_checkout_id: record.provider_order_id,
          amount: record.amount,
          currency: record.currency,
          status: "pending",
          source,
          reason,
          receipt,
          raw_event: razorpayOrder
        },
        { onConflict: "provider_order_id" }
      )
      .select("*")
      .single();

    if (error) throw error;
    return normalizePaymentRecord(data);
  }

  const store = getMemoryStore();
  store.orders.set(record.provider_order_id, record);
  return record;
}

export async function getPendingOrderByRazorpayOrderId(razorpayOrderId) {
  const supabase = getSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("provider", PRODUCT_PROVIDER)
      .eq("provider_order_id", razorpayOrderId)
      .maybeSingle();

    if (error) throw error;
    return data ? normalizePaymentRecord(data) : null;
  }

  return getMemoryStore().orders.get(razorpayOrderId) || null;
}

export async function markPaymentSuccess({
  email,
  razorpayOrderId,
  razorpayPaymentId,
  eventId = null,
  rawEvent = {}
}) {
  const existing = await getPendingOrderByRazorpayOrderId(razorpayOrderId);
  const record = {
    ...(existing || {}),
    email: email || existing?.email,
    provider: PRODUCT_PROVIDER,
    provider_order_id: razorpayOrderId,
    provider_payment_id: razorpayPaymentId,
    provider_event_id: eventId,
    amount: existing?.amount || rawEvent?.amount || PRODUCT_AMOUNT,
    currency: existing?.currency || rawEvent?.currency || PRODUCT_CURRENCY,
    status: "paid",
    raw_event: rawEvent,
    paid_at: new Date().toISOString()
  };

  const supabase = getSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from("payments")
      .upsert(
        {
          email: record.email,
          provider: PRODUCT_PROVIDER,
          provider_order_id: razorpayOrderId,
          provider_checkout_id: razorpayOrderId,
          provider_payment_id: razorpayPaymentId,
          provider_event_id: eventId,
          amount: record.amount,
          currency: record.currency,
          status: "paid",
          raw_event: rawEvent,
          paid_at: record.paid_at
        },
        { onConflict: "provider_order_id" }
      )
      .select("*")
      .single();

    if (error) throw error;
    return normalizePaymentRecord(data);
  }

  const store = getMemoryStore();
  store.orders.set(razorpayOrderId, record);
  if (razorpayPaymentId) store.payments.set(razorpayPaymentId, record);
  return record;
}

export async function createLicense({ email, paymentId = null, rawEvent = {} }) {
  const existing = await getLicenseByEmail(email);

  if (existing?.state === "paid_lifetime" && existing.license_ref) {
    return { ...existing, already_active: true };
  }

  const licenseRef = existing?.license_ref || createLicenseReference();
  const now = new Date().toISOString();
  const license = {
    email,
    license_ref: licenseRef,
    state: "paid_lifetime",
    max_devices: 3,
    payment_id: paymentId,
    raw_event: rawEvent,
    activated_at: existing?.activated_at || now,
    created_at: existing?.created_at || now,
    updated_at: now
  };

  const supabase = getSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from("licenses")
      .upsert(
        {
          email,
          license_ref: licenseRef,
          state: "paid_lifetime",
          max_devices: 3,
          activated_at: license.activated_at,
          metadata: {
            ...(existing?.metadata || {}),
            paymentId,
            paymentProvider: PRODUCT_PROVIDER
          }
        },
        { onConflict: "email" }
      )
      .select("*")
      .single();

    if (error) throw error;
    return { ...normalizeLicenseRecord(data), already_active: false };
  }

  getMemoryStore().licenses.set(email, license);
  return { ...license, already_active: false };
}

export async function getLicenseByEmail(email) {
  const supabase = getSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from("licenses")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error) throw error;
    return data ? normalizeLicenseRecord(data) : null;
  }

  return getMemoryStore().licenses.get(email) || null;
}

export async function activateDeviceForLicense({
  license,
  deviceIdHash,
  browserName,
  os,
  extensionVersion
}) {
  const maxDevices = license.max_devices || 3;
  const now = new Date().toISOString();
  const supabase = getSupabase();

  if (supabase) {
    const { data: existing, error: existingError } = await supabase
      .from("devices")
      .select("id, browser_name, os, extension_version, first_seen_at, last_seen_at, deactivated_at")
      .eq("license_id", license.id)
      .eq("device_id_hash", deviceIdHash)
      .order("last_seen_at", { ascending: false })
      .limit(1);

    if (existingError) throw existingError;

    const existingDevice = existing?.[0] || null;

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

      if (error) throw error;
      return { device: data, maxDevices };
    }

    const { count, error: countError } = await supabase
      .from("devices")
      .select("id", { count: "exact", head: true })
      .eq("license_id", license.id)
      .is("deactivated_at", null);

    if (countError) throw countError;
    if ((count || 0) >= maxDevices) {
      return { deviceLimitReached: true, maxDevices };
    }

    const payload = {
      license_id: license.id,
      device_id_hash: deviceIdHash,
      browser_name: browserName,
      os,
      extension_version: extensionVersion,
      first_seen_at: existingDevice?.first_seen_at || now,
      last_seen_at: now,
      deactivated_at: null
    };

    if (existingDevice) {
      const { data, error } = await supabase
        .from("devices")
        .update(payload)
        .eq("id", existingDevice.id)
        .select("id, browser_name, os, extension_version, first_seen_at, last_seen_at")
        .single();

      if (error) throw error;
      return { device: data, maxDevices };
    }

    const { data, error } = await supabase
      .from("devices")
      .insert(payload)
      .select("id, browser_name, os, extension_version, first_seen_at, last_seen_at")
      .single();

    if (error) throw error;
    return { device: data, maxDevices };
  }

  const store = getMemoryStore();
  const key = license.license_ref || license.email;
  const existingDevices = store.devices.get(key) || [];
  const existing = existingDevices.find((device) => device.device_id_hash === deviceIdHash);

  if (existing && !existing.deactivated_at) {
    existing.browser_name = browserName;
    existing.os = os;
    existing.extension_version = extensionVersion;
    existing.last_seen_at = now;
    store.devices.set(key, existingDevices);
    return { device: existing, maxDevices };
  }

  const activeCount = existingDevices.filter((device) => !device.deactivated_at).length;
  if (activeCount >= maxDevices) {
    return { deviceLimitReached: true, maxDevices };
  }

  const device = {
    id: crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(8).toString("hex"),
    device_id_hash: deviceIdHash,
    browser_name: browserName,
    os,
    extension_version: extensionVersion,
    first_seen_at: now,
    last_seen_at: now,
    deactivated_at: null
  };
  existingDevices.push(device);
  store.devices.set(key, existingDevices);
  return { device, maxDevices };
}

export async function listActiveDevicesForLicense(license) {
  const supabase = getSupabase();

  if (supabase && license?.id) {
    const { data, error } = await supabase
      .from("devices")
      .select("id, device_id_hash, browser_name, os, extension_version, first_seen_at, last_seen_at")
      .eq("license_id", license.id)
      .is("deactivated_at", null)
      .order("last_seen_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  const key = license?.license_ref || license?.email;
  if (!key) return [];
  return (getMemoryStore().devices.get(key) || []).filter((device) => !device.deactivated_at);
}

export async function hasProcessedWebhookEvent(eventId) {
  if (!eventId) return false;

  const supabase = getSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from("webhook_events")
      .select("event_id")
      .eq("provider", PRODUCT_PROVIDER)
      .eq("event_id", eventId)
      .maybeSingle();

    if (error) throw error;
    return Boolean(data);
  }

  return getMemoryStore().webhookEvents.has(eventId);
}

export async function markWebhookEventProcessed({
  eventId,
  eventType,
  razorpayOrderId = null,
  razorpayPaymentId = null,
  rawEvent = {}
}) {
  if (!eventId) return null;

  const supabase = getSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from("webhook_events")
      .upsert(
        {
          provider: PRODUCT_PROVIDER,
          event_id: eventId,
          event_type: eventType,
          provider_order_id: razorpayOrderId,
          provider_payment_id: razorpayPaymentId,
          raw_event: rawEvent,
          processed_at: new Date().toISOString()
        },
        { onConflict: "provider,event_id" }
      )
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  getMemoryStore().webhookEvents.add(eventId);
  return { event_id: eventId, event_type: eventType };
}

function normalizePaymentRecord(record) {
  if (!record) return null;

  return {
    ...record,
    provider_order_id: record.provider_order_id || record.provider_checkout_id
  };
}

function normalizeLicenseRecord(record) {
  if (!record) return null;

  return {
    ...record,
    license_ref: record.license_ref || record.metadata?.licenseRef || null
  };
}
