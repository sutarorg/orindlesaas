import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "@/lib/server/env";
import { integrationUnavailable } from "@/lib/server/errors";
import { AUTH_SESSION_POLICY_COOKIE, sessionMaxAge } from "@/lib/supabase/config";

export async function createSupabaseServerClient() {
  const config = getSupabasePublicConfig();
  if (!config) throw integrationUnavailable("Supabase Auth");
  const cookieStore = await cookies();

  return createServerClient(config.url, config.publishableKey, {
    cookieOptions: { maxAge: sessionMaxAge(cookieStore.get(AUTH_SESSION_POLICY_COOKIE)?.value), sameSite: "lax" },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(values) {
        try {
          values.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write cookies. proxy.ts refreshes the session.
        }
      },
    },
  });
}
