import type { Metadata } from "next";
import { z } from "zod";
import { CreditsWorkspace } from "@/components/dashboard/credits-workspace";
import { getRequestWorkspace } from "@/lib/server/workspace/request-cache";
export const metadata: Metadata = { title: "Credits & Wallet" };
export const dynamic = "force-dynamic";
export default async function CreditsPage({ searchParams }: { searchParams: Promise<{ purchase?: string | string[] }> }) { const [{ purchase }, data] = await Promise.all([searchParams, getRequestWorkspace()]); const value = Array.isArray(purchase) ? purchase[0] : purchase; return <CreditsWorkspace data={data} returnedPurchase={value && z.uuid().safeParse(value).success ? value : undefined} />; }
