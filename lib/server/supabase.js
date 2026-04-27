import { createClient } from "@supabase/supabase-js";
import { HttpError } from "./errors";

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new HttpError(
      500,
      "configuration_missing",
      `${name} is not configured on the server.`
    );
  }

  return value;
}

const clientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
};

export function createSupabaseAuthClient() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    clientOptions
  );
}

export function createSupabaseServiceClient() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    clientOptions
  );
}
