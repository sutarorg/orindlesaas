import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "@/lib/server/env";
import { requiresPrivateSession, safeNextPath } from "@/lib/server/auth/safe-redirect";
import { AUTH_SESSION_POLICY_COOKIE, sessionMaxAge } from "@/lib/supabase/config";

export async function proxy(request: NextRequest) {
  const config = getSupabasePublicConfig();
  if (!config) {
    if (requiresPrivateSession(request.nextUrl.pathname)) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", safeNextPath(request.nextUrl.pathname));
      login.searchParams.set("reason", "configuration");
      return NextResponse.redirect(login);
    }
    return NextResponse.next();
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
  if (requiresPrivateSession(request.nextUrl.pathname) && !data?.claims.sub) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", safeNextPath(`${request.nextUrl.pathname}${request.nextUrl.search}`));
    return NextResponse.redirect(login);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)"],
};
