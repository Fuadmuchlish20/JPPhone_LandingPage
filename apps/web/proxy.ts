import { NextResponse, type NextRequest } from "next/server";
import { DASHBOARD_URL } from "./lib/dashboard-url";
import { updateSession } from "./lib/supabase/proxy-session";

const PROTECTED = ["/admin"];
const AUTH_PAGES = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const path = request.nextUrl.pathname;

  if (!user && PROTECTED.some((p) => path === p || path.startsWith(`${p}/`))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }
  // Signed-in users go straight to the dashboard app.
  if (user && AUTH_PAGES.includes(path)) return NextResponse.redirect(new URL(DASHBOARD_URL, request.url));
  return response;
}

export const config = {
  matcher: [
    // everything except static assets, images, API routes (they authenticate themselves)
    "/((?!_next/static|_next/image|api/|favicon.ico|broadway/|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
