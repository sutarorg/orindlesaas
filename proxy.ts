import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "@/lib/server/env";
import { requiresPrivateSession, safeNextPath } from "@/lib/server/auth/safe-redirect";
import { AUTH_REQUEST_TIMEOUT_MS, AUTH_SESSION_POLICY_COOKIE, sessionMaxAge } from "@/lib/supabase/config";

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

  // Bound the refresh round-trip. An unreachable Auth host would otherwise hold every /app
  // request open, which the browser shows as the login page never navigating. A timeout is treated
  // as "no verified session" so the user lands on /login instead of hanging.
  const claims = await withTimeout(supabase.auth.getClaims(), AUTH_REQUEST_TIMEOUT_MS);
  const data = claims?.data ?? null;
  if (!data?.claims.sub) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", safeNextPath(`${request.nextUrl.pathname}${request.nextUrl.search}`));
    return NextResponse.redirect(login);
  }
  return response;
}

/** Resolves to null instead of rejecting or hanging past `ms`. */
async function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<null>((resolve) => { timer = setTimeout(() => resolve(null), ms); }),
    ]);
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export const config = {
  matcher: [
    // Session refresh is only needed for the private workspace and admin areas.
    "/app/:path*",
    "/admin/:path*",
  ],
};
