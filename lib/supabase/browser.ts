import { createBrowserClient } from "@supabase/ssr";
import { DEFAULT_SESSION_MAX_AGE, getBrowserSupabaseConfig } from "@/lib/supabase/config";

export function createSupabaseBrowserClient(maxAge = DEFAULT_SESSION_MAX_AGE) {
  const config = getBrowserSupabaseConfig();
  if (!config) return null;
  return createBrowserClient(config.url, config.publishableKey, {
    cookieOptions: { maxAge, sameSite: "lax" },
    isSingleton: false,
  });
}
