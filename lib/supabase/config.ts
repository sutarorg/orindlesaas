export const AUTH_SESSION_POLICY_COOKIE = "orindle_session_policy";

/**
 * Supabase calls are given a hard deadline. Without one, a slow or unreachable Auth host leaves
 * `signInWithPassword` and `getClaims` pending indefinitely: the login button stays on "Logging in…"
 * and the dashboard never redirects. Failing fast turns an invisible hang into a clear error.
 */
export const AUTH_REQUEST_TIMEOUT_MS = 12_000;
export const DEFAULT_SESSION_MAX_AGE = 12 * 60 * 60;
export const PERSISTENT_SESSION_MAX_AGE = 30 * 24 * 60 * 60;

export function getBrowserSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) return null;
  return { url, publishableKey };
}

export function sessionMaxAge(policy: string | undefined) {
  return policy === "persistent" ? PERSISTENT_SESSION_MAX_AGE : DEFAULT_SESSION_MAX_AGE;
}
