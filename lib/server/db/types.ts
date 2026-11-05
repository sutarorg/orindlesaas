import type { Db } from "@/lib/server/db/client";

export type DbTransaction = Parameters<Parameters<Db["transaction"]>[0]>[0];
