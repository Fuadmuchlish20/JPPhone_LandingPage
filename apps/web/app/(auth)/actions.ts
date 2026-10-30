"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DASHBOARD_URL } from "@/lib/dashboard-url";
import { serverEnv } from "@/lib/env";

export type AuthState = { error?: string; message?: string } | null;

function safeNext(v: FormDataEntryValue | null): string {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : DASHBOARD_URL;
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect(safeNext(formData.get("next")));
}

/** Starts "Continue with Google" (Supabase OAuth, PKCE). The callback route finishes the sign-in. */
export async function signInWithGoogle(next: string | undefined, _prev: AuthState, _fd: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const target = safeNext(next ?? null);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${serverEnv.siteUrl}/auth/callback?next=${encodeURIComponent(target)}`,
      queryParams: { prompt: "select_account" },
    },
  });
  if (error || !data.url) return { error: error?.message ?? "Google sign-in is not available right now." };
  redirect(data.url);
}

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("display_name") ?? "").trim();
  if (!email || password.length < 8) return { error: "Use a valid email and a password of at least 8 characters." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName || null },
      emailRedirectTo: `${serverEnv.siteUrl}/auth/callback`,
    },
  });
  if (error) return { error: error.message };
  if (!data.session) return { message: "Check your inbox to confirm your email, then log in." };
  redirect(DASHBOARD_URL);
}
