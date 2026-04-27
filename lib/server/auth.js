import { HttpError } from "./errors";
import { createSupabaseAuthClient } from "./supabase";
import { normalizeEmail } from "./validation";

export function getBearerToken(request) {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    throw new HttpError(401, "missing_auth_token", "Sign in with email OTP first.");
  }

  return match[1];
}

export async function getAuthenticatedUser(request) {
  const token = getBearerToken(request);
  const supabase = createSupabaseAuthClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user?.email) {
    throw new HttpError(401, "invalid_auth_token", "Your session has expired. Please verify your email again.");
  }

  return {
    token,
    user: data.user,
    email: normalizeEmail(data.user.email)
  };
}
