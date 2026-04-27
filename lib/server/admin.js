import { getAuthenticatedUser } from "./auth";
import { HttpError } from "./errors";

export function getAdminEmails() {
  return new Set(
    String(process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export async function requireAdminUser(request) {
  const auth = await getAuthenticatedUser(request);
  const admins = getAdminEmails();

  if (!admins.size) {
    throw new HttpError(
      500,
      "admin_not_configured",
      "ADMIN_EMAILS is not configured on the server."
    );
  }

  if (!admins.has(auth.email)) {
    throw new HttpError(403, "admin_forbidden", "This email is not an admin.");
  }

  return auth;
}
