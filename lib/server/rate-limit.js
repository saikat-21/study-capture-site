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

async function countEvents(supabase, column, value, eventType, sinceIso) {
  const { count, error } = await supabase
    .from("auth_events")
    .select("id", { count: "exact", head: true })
    .eq("event_type", eventType)
    .eq(column, value)
    .gte("created_at", sinceIso);

  if (error) {
    throw new HttpError(
      500,
      "rate_limit_unavailable",
      "Rate limit storage is not available."
    );
  }

  return count || 0;
}

export async function assertRateLimit({
  request,
  email,
  eventType,
  windowSeconds,
  emailLimit,
  ipLimit
}) {
  const supabase = createSupabaseServiceClient();
  const { ipHash, userAgent } = getRequestFingerprint(request);
  const sinceIso = new Date(Date.now() - windowSeconds * 1000).toISOString();

  const [emailCount, ipCount] = await Promise.all([
    countEvents(supabase, "email", email, eventType, sinceIso),
    countEvents(supabase, "ip_hash", ipHash, eventType, sinceIso)
  ]);

  if (emailCount >= emailLimit || ipCount >= ipLimit) {
    throw new HttpError(
      429,
      "rate_limited",
      "Too many attempts. Please wait a little and try again."
    );
  }

  return { supabase, ipHash, userAgent };
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
