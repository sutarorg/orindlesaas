import { readServerEnvironment, validateDodoMode, validateNoPublicSecrets } from "../lib/server/env";

const env = readServerEnvironment();
validateNoPublicSecrets();
validateDodoMode(env);

const groups = {
  authentication: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"],
  database: ["DATABASE_URL"],
  payments: ["DODO_PAYMENTS_API_KEY", "DODO_PAYMENTS_WEBHOOK_KEY", "DODO_PRODUCT_CREATOR_ID", "DODO_PRODUCT_PRO_ID", "DODO_PRODUCT_STUDIO_ID"],
  ai: ["AI_GATEWAY_API_KEY"],
  storage: ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"],
  jobs: ["JOBS_TICK_SECRET"],
  website: ["E2B_API_KEY", "VERCEL_API_TOKEN", "VERCEL_TEAM_ID"],
  email: ["RESEND_API_KEY", "RESEND_FROM_EMAIL", "SUPPORT_EMAIL"],
} as const;

for (const [name, keys] of Object.entries(groups)) {
  const missing = keys.filter((key) => !env[key]);
  console.log(`${name}: ${missing.length === 0 ? "configured" : `not ready (missing ${missing.join(", ")})`}`);
}
console.log(`Dodo environment: ${env.DODO_PAYMENTS_ENVIRONMENT}; Vercel target: ${env.VERCEL_DEPLOY_TARGET}`);
console.log("No secret values were printed. Missing integrations must remain unavailable, not mocked as successful.");
