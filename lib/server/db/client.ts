import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { requireEnvironment } from "@/lib/server/env";
import { schema, type DatabaseSchema } from "@/lib/server/db/schema";

let client: ReturnType<typeof postgres> | undefined;
let database: PostgresJsDatabase<DatabaseSchema> | undefined;

export function getDb() {
  if (database) return database;
  const { DATABASE_URL: url } = requireEnvironment(["DATABASE_URL"], "PostgreSQL");
  client = postgres(url, {
    max: 10,
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  database = drizzle(client, { schema });
  return database;
}

export async function closeDb() {
  if (client) await client.end({ timeout: 5 });
  client = undefined;
  database = undefined;
}

export type Db = ReturnType<typeof getDb>;
