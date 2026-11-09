import { z } from "zod";
import { integrationUnavailable } from "@/lib/server/errors";

const optionalUrl = z.union([z.literal(""), z.url()]).optional();
const optionalString = z.string().trim().optional();

export const serverEnvironmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  NEXT_PUBLIC_SITE_URL: z.url().default("https://orindle.com"),
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optionalString,
  DATABASE_URL: optionalString,
  SUPABASE_SECRET_KEY: optionalString,
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  DODO_PAYMENTS_ENVIRONMENT: z.enum(["test_mode", "live_mode"]).default("test_mode"),
  DODO_PAYMENTS_API_KEY: optionalString,
  DODO_PAYMENTS_WEBHOOK_KEY: optionalString,
  DODO_PRODUCT_CREATOR_ID: optionalString,
  DODO_PRODUCT_PRO_ID: optionalString,
  DODO_PRODUCT_STUDIO_ID: optionalString,
  AI_GATEWAY_API_KEY: optionalString,
  R2_ACCOUNT_ID: optionalString,
  R2_ACCESS_KEY_ID: optionalString,
  R2_SECRET_ACCESS_KEY: optionalString,
  R2_BUCKET: optionalString,
  JOBS_TICK_SECRET: optionalString,
  E2B_API_KEY: optionalString,
  VERCEL_API_TOKEN: optionalString,
  VERCEL_TEAM_ID: optionalString,
  VERCEL_PROJECT_PREFIX: z.string().regex(/^[a-z0-9-]{1,40}$/).default("orindle-site"),
  VERCEL_DEPLOY_TARGET: z.enum(["preview", "production"]).default("preview"),
  AI_ALLOWED_ASSET_HOSTS: optionalString,
  RESEND_API_KEY: optionalString,
  RESEND_FROM_EMAIL: optionalString,
  SUPPORT_EMAIL: optionalString,
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

export function readServerEnvironment(source: Record<string, string | undefined> = process.env) {
  return serverEnvironmentSchema.parse(source);
}

export function getSupabasePublicConfig(env = readServerEnvironment()) {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return null;
  }
  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}

export function requireEnvironment<K extends keyof ServerEnvironment>(
  keys: readonly K[],
  integration: string,
  env = readServerEnvironment(),
): { [P in K]: NonNullable<ServerEnvironment[P]> } {
  if (keys.some((key) => !env[key])) throw integrationUnavailable(integration);
  return Object.fromEntries(keys.map((key) => [key, env[key]])) as { [P in K]: NonNullable<ServerEnvironment[P]> };
}

export function validateDodoMode(env = readServerEnvironment()) {
  if (!env.DODO_PAYMENTS_API_KEY) return;
  const key = env.DODO_PAYMENTS_API_KEY;
  const looksLive = key.startsWith("live_") || key.startsWith("pk_live_");
  const looksTest = key.startsWith("test_") || key.startsWith("pk_test_");
  if (env.DODO_PAYMENTS_ENVIRONMENT === "test_mode" && looksLive) {
    throw new Error("Dodo live credentials cannot be used while DODO_PAYMENTS_ENVIRONMENT=test_mode.");
  }
  if (env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" && looksTest) {
    throw new Error("Dodo test credentials cannot be used while DODO_PAYMENTS_ENVIRONMENT=live_mode.");
  }
}

export function validateNoPublicSecrets(source: Record<string, string | undefined> = process.env) {
  const forbidden = /(SECRET|SERVICE_ROLE|DATABASE|WEBHOOK|API_TOKEN|API_KEY|PRIVATE_KEY|ACCESS_KEY)/;
  const exposed = Object.keys(source).filter(
    (key) => key.startsWith("NEXT_PUBLIC_") && forbidden.test(key),
  );
  if (exposed.length > 0) {
    throw new Error(`Forbidden secret-like public environment names: ${exposed.join(", ")}`);
  }
}
