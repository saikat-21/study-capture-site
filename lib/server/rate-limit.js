import crypto from "crypto";
import { HttpError } from "./errors";
import { createSupabaseServiceClient } from "./supabase";

function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

function hashValue(value) {
  const secret =
    process.env.RATE_LIMIT_SECRET ||
    process.env.LICENSE_TOKEN_SECRET ||
    "study-capture-development-rate-limit";

  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

export function getRequestFingerprint(request) {
  return {
    ipHash: hashValue(getClientIp(request)),
    userAgent: request.headers.get("user-agent") || null
  };
}

export function hasRateLimitStore() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

async function getRateLimitStats(supabase, column, value, eventType, sinceIso) {
  const { data, count, error } = await supabase
    .from("auth_events")
    .select("created_at", { count: "exact" })
    .eq("event_type", eventType)
    .eq(column, value)
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) {
    throw new HttpError(
      500,
      "rate_limit_unavailable",
      "Rate limit storage is not available."
    );
  }

  return {
    count: count || 0,
    oldestCreatedAt: data?.[0]?.created_at || null
  };
}

export async function assertRateLimit({
  request,
  email,
  eventType,
  windowSeconds,
  emailLimit,
  ipLimit
}) {
  if (process.env.NODE_ENV === "development" && process.env.RATE_LIMIT_DEV_BYPASS === "true") {
    const { ipHash, userAgent } = getRequestFingerprint(request);
    return { supabase: createSupabaseServiceClient(), ipHash, userAgent };
  }

  const supabase = createSupabaseServiceClient();
  const { ipHash, userAgent } = getRequestFingerprint(request);
  const sinceIso = new Date(Date.now() - windowSeconds * 1000).toISOString();
  const effectiveEmailLimit =
    process.env.NODE_ENV === "development"
      ? Number(process.env.RATE_LIMIT_DEV_EMAIL_LIMIT || 50)
      : emailLimit;
  const effectiveIpLimit =
    process.env.NODE_ENV === "development"
      ? Number(process.env.RATE_LIMIT_DEV_IP_LIMIT || 200)
      : ipLimit;

  const [emailStats, ipStats] = await Promise.all([
    getRateLimitStats(supabase, "email", email, eventType, sinceIso),
    getRateLimitStats(supabase, "ip_hash", ipHash, eventType, sinceIso)
  ]);

  const emailLimited = emailStats.count >= effectiveEmailLimit;
  const ipLimited = ipStats.count >= effectiveIpLimit;

  if (emailLimited || ipLimited) {
    const limitingStats = emailLimited ? emailStats : ipStats;
    const retry = retryDetails({
      oldestCreatedAt: limitingStats.oldestCreatedAt,
      windowSeconds,
      limitType: emailLimited ? "email" : "ip",
      limit: emailLimited ? effectiveEmailLimit : effectiveIpLimit
    });

    throw new HttpError(
      429,
      "rate_limited",
      `Too many attempts. Please try again in ${formatRetryAfter(retry.retryAfterSeconds)}.`,
      retry
    );
  }

  return { supabase, ipHash, userAgent };
}

function retryDetails({ oldestCreatedAt, windowSeconds, limitType, limit }) {
  const now = Date.now();
  const oldestMs = oldestCreatedAt ? Date.parse(oldestCreatedAt) : now;
  const resetMs = Number.isFinite(oldestMs) ? oldestMs + windowSeconds * 1000 : now + windowSeconds * 1000;
  const retryAfterSeconds = Math.max(1, Math.ceil((resetMs - now) / 1000));

  return {
    retryAfterSeconds,
    resetAt: new Date(now + retryAfterSeconds * 1000).toISOString(),
    limitType,
    limit,
    windowSeconds
  };
}

function formatRetryAfter(seconds) {
  if (seconds < 60) return `${seconds} second${seconds === 1 ? "" : "s"}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

export async function maybeAssertRateLimit(options) {
  if (!hasRateLimitStore()) return null;
  return assertRateLimit(options);
}

export async function maybeRecordAuthEvent(options) {
  if (!options?.supabase) return;
  return recordAuthEvent(options);
}

export async function recordAuthEvent({
  supabase,
  request,
  email,
  eventType,
  success,
  metadata = {}
}) {
  const fingerprint = request ? getRequestFingerprint(request) : {};

  const { error } = await supabase.from("auth_events").insert({
    event_type: eventType,
    email,
    ip_hash: fingerprint.ipHash || metadata.ipHash || null,
    success,
    user_agent: fingerprint.userAgent || metadata.userAgent || null,
    metadata
  });

  if (error) {
    console.error("Failed to record auth event", error);
  }
}
