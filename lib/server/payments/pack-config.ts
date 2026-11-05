import { z } from "zod";
import { creditPacks, type CreditPack } from "@/lib/content/pricing";
import { readServerEnvironment } from "@/lib/server/env";
import { integrationUnavailable } from "@/lib/server/errors";

export const packIdSchema = z.enum(["creator", "pro", "studio"]);

export function getServerPack(id: string): CreditPack & { priceUsdCents: number; providerProductId: string } {
  const pack = creditPacks.find((candidate) => candidate.id === packIdSchema.parse(id));
  if (!pack) throw new Error("Pack configuration is inconsistent.");
  const env = readServerEnvironment();
  const providerProductId = {
    creator: env.DODO_PRODUCT_CREATOR_ID,
    pro: env.DODO_PRODUCT_PRO_ID,
    studio: env.DODO_PRODUCT_STUDIO_ID,
  }[pack.id];
  if (!providerProductId) throw integrationUnavailable("Dodo credit-pack products");
  return { ...pack, priceUsdCents: pack.priceUsd * 100, providerProductId };
}

export function validateCheckoutUrl(value: string) {
  const url = new URL(value);
  const allowedHosts = new Set(["checkout.dodopayments.com", "test.checkout.dodopayments.com"]);
  if (url.protocol !== "https:" || !allowedHosts.has(url.hostname) || url.username || url.password) {
    throw new Error("Dodo returned an unexpected checkout destination.");
  }
  return url.toString();
}
