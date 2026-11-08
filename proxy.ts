import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "@/lib/server/env";
import { requiresPrivateSession, safeNextPath } from "@/lib/server/auth/safe-redirect";
import { AUTH_SESSION_POLICY_COOKIE, sessionMaxAge } from "@/lib/supabase/config";

export async function proxy(request: NextRequest) {
  // Only /app and /admin read the session on the server. Every public marketing page is static or
  // session-independent, so running the auth client for them did work nothing consumed: it decoded
  // cookies and, for asymmetric signing keys, could call Supabase on each hit before the response
  // started. Public routes now pass straight through.
  if (!requiresPrivateSession(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", safeNextPath(request.nextUrl.pathname));
    login.searchParams.set("reason", "configuration");
    return NextResponse.redirect(login);
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.publishableKey, {
    cookieOptions: { maxAge: sessionMaxAge(request.cookies.get(AUTH_SESSION_POLICY_COOKIE)?.value), sameSite: "lax" },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(values) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  if (!data?.claims.sub) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", safeNextPath(`${request.nextUrl.pathname}${request.nextUrl.search}`));
    return NextResponse.redirect(login);
  }
  return response;
}

export const config = {
  matcher: [
    // Session refresh is only needed for the private workspace and admin areas.
    "/app/:path*",
    "/admin/:path*",
  ],
};
