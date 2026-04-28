import { fail, HttpError, ok, readJson } from "../../../../lib/server/errors";
import { assertRateLimit, recordAuthEvent } from "../../../../lib/server/rate-limit";
import { createSupabaseAuthClient } from "../../../../lib/server/supabase";
import { normalizeEmail } from "../../../../lib/server/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  let email;
  let rateLimitContext;
  let eventRecorded = false;

  try {
    const body = await readJson(request);
    email = normalizeEmail(body.email);
    rateLimitContext = await assertRateLimit({
      request,
      email,
      eventType: "otp_send",
      windowSeconds: 60 * 60,
      emailLimit: 5,
      ipLimit: 20
    });

    const supabase = createSupabaseAuthClient();
    const emailRedirectTo = getAuthRedirectUrl();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo
      }
    });

    await recordAuthEvent({
      supabase: rateLimitContext.supabase,
      request,
      email,
      eventType: "otp_send",
      success: !error,
      metadata: error ? { reason: error.message, emailRedirectTo } : { emailRedirectTo }
    });
    eventRecorded = true;

    if (error) {
      throw new HttpError(
        400,
        "otp_send_failed",
        "Could not send the OTP. Please check the email and try again."
      );
    }

    return ok({
      message: "Verification code sent. Check your inbox."
    });
  } catch (error) {
    if (email && rateLimitContext?.supabase && !eventRecorded) {
      await recordAuthEvent({
        supabase: rateLimitContext.supabase,
        request,
        email,
        eventType: "otp_send",
        success: false,
        metadata: { reason: error.code || error.message }
      });
    }

    return fail(error);
  }
}

function getAuthRedirectUrl() {
  const configured =
    process.env.SUPABASE_AUTH_REDIRECT_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://studycapture.co";

  try {
    const url = new URL(configured);
    if (process.env.NODE_ENV === "production" && url.hostname === "localhost") {
      return "https://studycapture.co/login";
    }
    if (url.pathname === "/" || url.pathname === "") {
      url.pathname = "/login";
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return "https://studycapture.co/login";
  }
}
