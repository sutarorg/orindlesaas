import path from "node:path";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { closeDb, getDb } from "../lib/server/db/client";

try {
  await migrate(getDb(), { migrationsFolder: path.resolve("drizzle") });
  console.log("Reviewed Drizzle migrations applied.");
} finally {
  await closeDb();
}
