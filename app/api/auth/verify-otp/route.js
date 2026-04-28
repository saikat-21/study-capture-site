import { fail, HttpError, ok, readJson } from "../../../../lib/server/errors";
import { assertRateLimit, recordAuthEvent } from "../../../../lib/server/rate-limit";
import { ensureProfileForAuthUser } from "../../../../lib/server/licenses";
import {
  createSupabaseAuthClient,
  createSupabaseServiceClient
} from "../../../../lib/server/supabase";
import { normalizeEmail, normalizeOtp } from "../../../../lib/server/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  let email;
  let rateLimitContext;
  let eventRecorded = false;

  try {
    const body = await readJson(request);
    email = normalizeEmail(body.email);
    const otp = normalizeOtp(body.otp);

    rateLimitContext = await assertRateLimit({
      request,
      email,
      eventType: "otp_verify",
      windowSeconds: 15 * 60,
      emailLimit: 8,
      ipLimit: 40
    });

    const supabaseAuth = createSupabaseAuthClient();
    const { data, error } = await supabaseAuth.auth.verifyOtp({
      email,
      token: otp,
      type: "email"
    });

    await recordAuthEvent({
      supabase: rateLimitContext.supabase,
      request,
      email,
      eventType: "otp_verify",
      success: !error,
      metadata: error ? { reason: error.message } : {}
    });
    eventRecorded = true;

    if (error || !data?.session || !data?.user) {
      throw new HttpError(401, "otp_invalid", "The verification code is invalid or expired.");
    }

    const service = createSupabaseServiceClient();
    await ensureProfileForAuthUser(service, data.user, email);

    return ok({
      message: "Email verified.",
      email,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in,
        token_type: data.session.token_type
      }
    });
  } catch (error) {
    if (email && rateLimitContext?.supabase && !eventRecorded) {
      await recordAuthEvent({
        supabase: rateLimitContext.supabase,
        request,
        email,
        eventType: "otp_verify",
        success: false,
        metadata: { reason: error.code || error.message }
      });
    }

    return fail(error);
  }
}
