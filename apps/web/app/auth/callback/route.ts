import { NextResponse, type NextRequest } from "next/server";
import { DASHBOARD_URL } from "@/lib/dashboard-url";
import { createClient } from "@/lib/supabase/server";

/** Email confirmation, magic-link and OAuth (Google) landing: exchange the code for a session. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next") ?? "";
  // Only same-site paths, never "//evil.com".
  const target = next.startsWith("/") && !next.startsWith("//") ? next : DASHBOARD_URL;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(target, request.url));
  }
  return NextResponse.redirect(new URL("/login?error=oauth", request.url));
}
