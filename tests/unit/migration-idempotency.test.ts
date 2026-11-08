import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Migration 0003 must be re-runnable. Applying it to a database that already has its objects used
 * to fail with `42P07: relation "catalog_price_observations" already exists`, which left operators
 * unable to finish a partially applied migration.
 */
const sql = readFileSync(path.join(process.cwd(), "drizzle/0003_milky_dark_beast.sql"), "utf8");

describe("migration 0003 is idempotent", () => {
  it("guards every CREATE TABLE", () => {
    const creates = sql.match(/CREATE TABLE (?!IF NOT EXISTS)/g) ?? [];
    expect(creates).toEqual([]);
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS "catalog_price_observations"');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS "catalog_sync_runs"');
  });

  it("guards every ADD COLUMN and CREATE INDEX", () => {
    expect(sql.match(/ADD COLUMN (?!IF NOT EXISTS)/g) ?? []).toEqual([]);
    expect(sql.match(/CREATE INDEX (?!IF NOT EXISTS)/g) ?? []).toEqual([]);
  });

  it("guards DROP CONSTRAINT", () => {
    expect(sql.match(/DROP CONSTRAINT (?!IF EXISTS)/g) ?? []).toEqual([]);
  });

  it("adds constraints inside duplicate-tolerant blocks", () => {
    // ADD CONSTRAINT has no IF NOT EXISTS form, so every one must sit inside a DO block that
    // swallows duplicate_object. Otherwise a re-run fails with 42710.
    const positions = [...sql.matchAll(/ADD CONSTRAINT/g)].map((match) => match.index ?? 0);
    expect(positions).toHaveLength(7);
    for (const position of positions) {
      const blockStart = sql.lastIndexOf("DO $$ BEGIN", position);
      const blockEnd = sql.indexOf("END $$;", position);
      expect(blockStart).toBeGreaterThan(-1);
      expect(blockEnd).toBeGreaterThan(position);
      expect(sql.slice(blockStart, blockEnd)).toContain("EXCEPTION WHEN duplicate_object THEN NULL");
    }
  });

  it("drops each trigger before recreating it", () => {
    const triggers = sql.match(/CREATE TRIGGER "([a-z_]+)"/g) ?? [];
    const drops = sql.match(/DROP TRIGGER IF EXISTS "[a-z_]+"/g) ?? [];
    expect(triggers).toHaveLength(4);
    expect(drops).toHaveLength(4);
  });

  it("keeps every original constraint name", () => {
    for (const name of [
      "catalog_price_observations_run_id_catalog_sync_runs_id_fk",
      "catalog_price_observations_model_id_models_id_fk",
      "catalog_sync_runs_actor_id_profiles_id_fk",
      "model_prices_model_id_models_id_fk",
      "models_discovery_status_valid",
      "models_enabled_has_product",
      "models_compatibility_version_nonnegative",
    ]) {
      expect(sql).toContain(name);
    }
  });
});
