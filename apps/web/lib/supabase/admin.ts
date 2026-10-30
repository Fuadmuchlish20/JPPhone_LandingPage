import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { serverEnv } from "../env";

let client: SupabaseClient | null = null;

/** Service-role client. Bypasses RLS — only use after explicit authorization checks. */
export function adminClient(): SupabaseClient {
  client ??= createClient(serverEnv.supabaseUrl, serverEnv.supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
