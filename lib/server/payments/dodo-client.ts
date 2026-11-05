import DodoPayments from "dodopayments";
import { readServerEnvironment, validateDodoMode } from "@/lib/server/env";
import { integrationUnavailable } from "@/lib/server/errors";

export function createDodoClient(requireApiKey = true) {
  const env = readServerEnvironment();
  validateDodoMode(env);
  if (requireApiKey && !env.DODO_PAYMENTS_API_KEY) throw integrationUnavailable("Dodo Payments");
  return new DodoPayments({
    bearerToken: env.DODO_PAYMENTS_API_KEY,
    webhookKey: env.DODO_PAYMENTS_WEBHOOK_KEY,
    environment: env.DODO_PAYMENTS_ENVIRONMENT,
    maxRetries: 0,
    timeout: 10_000,
  });
}
