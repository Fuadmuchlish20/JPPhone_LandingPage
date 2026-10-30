import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Who's signed in — read by the header on statically rendered pages. */
export async function GET() {
  const profile = await getProfile();
  return NextResponse.json(
    { profile: profile ? { email: profile.email, is_admin: profile.is_admin } : null },
    { headers: { "cache-control": "private, no-store" } },
  );
}
