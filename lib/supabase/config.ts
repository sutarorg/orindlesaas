export const AUTH_SESSION_POLICY_COOKIE = "orindle_session_policy";
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
