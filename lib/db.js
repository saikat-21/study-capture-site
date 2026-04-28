import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const PRODUCT_AMOUNT = 79900;
const PRODUCT_CURRENCY = "INR";
const PRODUCT_PROVIDER = "razorpay";
const PAYMENTS_PROVIDER_ORDER_CONFLICT = "provider_order_id";

function getMemoryStore() {
  if (!globalThis.__studyCaptureMockDb) {
    globalThis.__studyCaptureMockDb = {
      orders: new Map(),
      payments: new Map(),
      licenses: new Map(),
      subscriptions: new Map(),
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
  receipt,
  metadata = {}
}) {
  const rawEvent = withStudyCaptureMetadata(razorpayOrder, metadata);
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
    raw_event: rawEvent,
    created_at: new Date().toISOString()
  };

  const supabase = getSupabase();

  if (supabase) {
    const user = await ensureUserByEmail(supabase, email);
    const operation = "createPendingOrder.upsert";
    const { data, error } = await supabase
      .from("payments")
      .upsert(
        {
          user_id: user.id,
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
          raw_event: rawEvent
        },
        { onConflict: PAYMENTS_PROVIDER_ORDER_CONFLICT }
      )
      .select("*")
      .single();

    if (error) {
      logSupabaseMutationError({
        table: "payments",
        operation,
        onConflict: PAYMENTS_PROVIDER_ORDER_CONFLICT,
        error,
        context: {
          providerOrderId: record.provider_order_id,
          status: record.status,
          source,
          reason
        }
      });
      throw error;
    }
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
  const mergedRawEvent = mergePaymentRawEvent({
    existingRawEvent: existing?.raw_event,
    incomingRawEvent: rawEvent,
    eventKey: "payment_success_event"
  });
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
    raw_event: mergedRawEvent,
    paid_at: new Date().toISOString()
  };

  const supabase = getSupabase();

  if (supabase) {
    const user = record.email ? await ensureUserByEmail(supabase, record.email) : null;
    const operation = "markPaymentSuccess.upsert";
    const { data, error } = await supabase
      .from("payments")
      .upsert(
        {
          user_id: user?.id || null,
          email: record.email,
          provider: PRODUCT_PROVIDER,
          provider_order_id: razorpayOrderId,
          provider_checkout_id: razorpayOrderId,
          provider_payment_id: razorpayPaymentId,
          provider_event_id: eventId,
          amount: record.amount,
          currency: record.currency,
          status: "paid",
          source: record.source || null,
          reason: record.reason || null,
          receipt: record.receipt || null,
          raw_event: record.raw_event,
          paid_at: record.paid_at
        },
        { onConflict: PAYMENTS_PROVIDER_ORDER_CONFLICT }
      )
      .select("*")
      .single();

    if (error) {
      logSupabaseMutationError({
        table: "payments",
        operation,
        onConflict: PAYMENTS_PROVIDER_ORDER_CONFLICT,
        error,
        context: {
          providerOrderId: razorpayOrderId,
          providerPaymentId: razorpayPaymentId,
          status: record.status
        }
      });
      throw error;
    }
    return normalizePaymentRecord(data);
  }

  const store = getMemoryStore();
  store.orders.set(razorpayOrderId, record);
  if (razorpayPaymentId) store.payments.set(razorpayPaymentId, record);
  return record;
}

export async function markPaymentFailed({
  email,
  razorpayOrderId,
  razorpayPaymentId = null,
  eventId = null,
  rawEvent = {}
}) {
  const existing = razorpayOrderId
    ? await getPendingOrderByRazorpayOrderId(razorpayOrderId)
    : null;
  const mergedRawEvent = mergePaymentRawEvent({
    existingRawEvent: existing?.raw_event,
    incomingRawEvent: rawEvent,
    eventKey: "payment_failed_event"
  });
  const record = {
    ...(existing || {}),
    email: email || existing?.email,
    provider: PRODUCT_PROVIDER,
    provider_order_id: razorpayOrderId,
    provider_payment_id: razorpayPaymentId,
    provider_event_id: eventId,
    amount: existing?.amount || rawEvent?.amount || PRODUCT_AMOUNT,
    currency: existing?.currency || rawEvent?.currency || PRODUCT_CURRENCY,
    status: "failed",
    raw_event: mergedRawEvent
  };

  const supabase = getSupabase();

  if (supabase) {
    const user = record.email ? await ensureUserByEmail(supabase, record.email) : null;
    const operation = "markPaymentFailed.upsert";
    const { data, error } = await supabase
      .from("payments")
      .upsert(
        {
          user_id: user?.id || null,
          email: record.email,
          provider: PRODUCT_PROVIDER,
          provider_order_id: razorpayOrderId,
          provider_checkout_id: razorpayOrderId,
          provider_payment_id: razorpayPaymentId,
          provider_event_id: eventId,
          amount: record.amount,
          currency: record.currency,
          status: "failed",
          source: record.source || null,
          reason: record.reason || null,
          receipt: record.receipt || null,
          raw_event: record.raw_event
        },
        { onConflict: PAYMENTS_PROVIDER_ORDER_CONFLICT }
      )
      .select("*")
      .single();

    if (error) {
      logSupabaseMutationError({
        table: "payments",
        operation,
        onConflict: PAYMENTS_PROVIDER_ORDER_CONFLICT,
        error,
        context: {
          providerOrderId: razorpayOrderId,
          providerPaymentId: razorpayPaymentId,
          status: record.status
        }
      });
      throw error;
    }
    return normalizePaymentRecord(data);
  }

  const store = getMemoryStore();
  if (razorpayOrderId) store.orders.set(razorpayOrderId, record);
  if (razorpayPaymentId) store.payments.set(razorpayPaymentId, record);
  return record;
}

export async function createLicense({
  email,
  paymentId = null,
  paymentRecordId = null,
  rawEvent = {}
}) {
  const existing = await getLicenseByEmail(email);
  const supabase = getSupabase();

  if (existing?.state === "paid_lifetime" && existing.license_ref) {
    if (supabase) {
      const user = await ensureUserByEmail(supabase, email);
      if (!existing.user_id) {
        const { error } = await supabase
          .from("licenses")
          .update({ user_id: user.id })
          .eq("id", existing.id);
        if (error) throw error;
      }
      await linkPaymentToLicense({
        supabase,
        licenseId: existing.id,
        paymentRecordId,
        paymentId
      });
      await upsertSubscriptionForLicense({
        supabase,
        userId: existing.user_id || user.id,
        license: existing,
        paymentRecordId,
        paymentId,
        rawEvent
      });
    }

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

  if (supabase) {
    const user = await ensureUserByEmail(supabase, email);
    const { data, error } = await supabase
      .from("licenses")
      .upsert(
        {
          user_id: user.id,
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
    const normalizedLicense = normalizeLicenseRecord(data);

    await linkPaymentToLicense({
      supabase,
      licenseId: normalizedLicense.id,
      paymentRecordId,
      paymentId
    });
    await upsertSubscriptionForLicense({
      supabase,
      userId: user.id,
      license: normalizedLicense,
      paymentRecordId,
      paymentId,
      rawEvent
    });

    return { ...normalizedLicense, already_active: false };
  }

  getMemoryStore().licenses.set(email, license);
  getMemoryStore().subscriptions.set(email, {
    email,
    license_id: license.license_ref,
    plan: "pro_lifetime",
    status: "active",
    provider: PRODUCT_PROVIDER,
    provider_payment_id: paymentId,
    amount: Number(rawEvent?.amount) || PRODUCT_AMOUNT,
    currency: PRODUCT_CURRENCY,
    lifetime_access: true,
    started_at: license.activated_at,
    metadata: { rawEvent }
  });
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

export async function getSubscriptionByEmail(email) {
  const supabase = getSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("email", email)
      .eq("plan", "pro_lifetime")
      .maybeSingle();

    if (error) throw error;
    return data || null;
  }

  return getMemoryStore().subscriptions.get(email) || null;
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

async function ensureUserByEmail(supabase, email) {
  const { data, error } = await supabase
    .from("users")
    .upsert({ email }, { onConflict: "email" })
    .select("id, email, auth_user_id")
    .single();

  if (error) throw error;
  return data;
}

async function linkPaymentToLicense({
  supabase,
  licenseId,
  paymentRecordId,
  paymentId
}) {
  if (!licenseId) return;

  let query = supabase.from("payments").update({ license_id: licenseId });

  if (paymentRecordId) {
    query = query.eq("id", paymentRecordId);
  } else if (paymentId) {
    query = query.eq("provider_payment_id", paymentId);
  } else {
    return;
  }

  const { error } = await query;
  if (error) throw error;
}

async function upsertSubscriptionForLicense({
  supabase,
  userId,
  license,
  paymentRecordId,
  paymentId,
  rawEvent
}) {
  if (!license?.email || !license?.id) return null;

  let payment = null;

  if (paymentRecordId) {
    const { data, error } = await supabase
      .from("payments")
      .select("id, provider_order_id, provider_payment_id, amount, currency, paid_at")
      .eq("id", paymentRecordId)
      .maybeSingle();
    if (error) throw error;
    payment = data;
  } else if (paymentId) {
    const { data, error } = await supabase
      .from("payments")
      .select("id, provider_order_id, provider_payment_id, amount, currency, paid_at")
      .eq("provider_payment_id", paymentId)
      .maybeSingle();
    if (error) throw error;
    payment = data;
  }

  const startedAt =
    license.activated_at ||
    payment?.paid_at ||
    new Date().toISOString();

  const { data, error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: userId || license.user_id || null,
        license_id: license.id,
        email: license.email,
        plan: "pro_lifetime",
        status: "active",
        provider: PRODUCT_PROVIDER,
        provider_order_id: payment?.provider_order_id || null,
        provider_payment_id: payment?.provider_payment_id || paymentId || null,
        amount: payment?.amount || PRODUCT_AMOUNT,
        currency: payment?.currency || PRODUCT_CURRENCY,
        lifetime_access: true,
        started_at: startedAt,
        ended_at: null,
        metadata: {
          licenseRef: license.license_ref,
          rawEvent
        }
      },
      { onConflict: "email,plan" }
    )
    .select("*")
    .single();

  if (error) throw error;
  return data;
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

function withStudyCaptureMetadata(rawEvent = {}, metadata = {}) {
  const safeRawEvent = isPlainObject(rawEvent) ? rawEvent : {};
  const safeMetadata = isPlainObject(metadata) ? metadata : {};

  return {
    ...safeRawEvent,
    study_capture: {
      ...(isPlainObject(safeRawEvent.study_capture) ? safeRawEvent.study_capture : {}),
      ...safeMetadata
    }
  };
}

function mergePaymentRawEvent({
  existingRawEvent = {},
  incomingRawEvent = {},
  eventKey
}) {
  const existing = isPlainObject(existingRawEvent) ? existingRawEvent : {};
  const incoming = isPlainObject(incomingRawEvent) ? incomingRawEvent : {};
  const metadata = {
    ...(isPlainObject(existing.study_capture) ? existing.study_capture : {}),
    ...(isPlainObject(incoming.study_capture) ? incoming.study_capture : {})
  };

  return {
    ...existing,
    [eventKey]: incoming,
    study_capture: metadata
  };
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

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function logSupabaseMutationError({
  table,
  operation,
  onConflict,
  error,
  context = {}
}) {
  console.error("[Study Capture Supabase mutation failed]", {
    table,
    operation,
    onConflict,
    error: {
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint
    },
    context
  });
}
