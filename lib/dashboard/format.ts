import type { FixtureAsset, FixtureGeneration, ProductId } from "@/lib/contracts/dashboard";

const creditFormatter = new Intl.NumberFormat("en-US");

export function formatCredits(value: number) {
  return creditFormatter.format(value);
}

export const productLabels: Record<ProductId, string> = {
  chat: "Chat",
  image: "Image Studio",
  video: "Video Studio",
  website: "Websites",
};

export const statusLabels: Record<FixtureGeneration["status"], string> = {
  queued: "Queued",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
};

export function searchMatches(values: readonly string[], query: string) {
  const normalized = query.trim().toLocaleLowerCase("en-US");
  return normalized.length === 0 || values.some((value) => value.toLocaleLowerCase("en-US").includes(normalized));
}

export function filterAssets(
  assets: readonly FixtureAsset[],
  query: string,
  type: FixtureAsset["type"] | "all",
) {
  return assets.filter((asset) =>
    (type === "all" || asset.type === type) && searchMatches([asset.name, asset.alt], query),
  );
}

export function filterGenerations(
  generations: readonly FixtureGeneration[],
  query: string,
  product: ProductId | "all",
  status: FixtureGeneration["status"] | "all",
) {
  return generations.filter((generation) =>
    (product === "all" || generation.product === product) &&
    (status === "all" || generation.status === status) &&
    searchMatches([generation.title, generation.modelId], query),
  );
}

export function safeFileName(value: string) {
  const normalized = value
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return normalized || "orindle-fixture";
}
