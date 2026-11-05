import type { Metadata } from "next";
import { z } from "zod";
import { CreditsWorkspace } from "@/components/dashboard/credits-workspace";
import { requireUser } from "@/lib/server/auth/guards";
import { getWorkspaceSnapshot } from "@/lib/server/workspace/queries";
export const metadata: Metadata = { title: "Credits & Wallet" };
export const dynamic = "force-dynamic";
export default async function CreditsPage({ searchParams }: { searchParams: Promise<{ purchase?: string | string[] }> }) { const identity = await requireUser(); const [{ purchase }, data] = await Promise.all([searchParams, getWorkspaceSnapshot(identity.userId)]); const value = Array.isArray(purchase) ? purchase[0] : purchase; return <CreditsWorkspace data={data} returnedPurchase={value && z.uuid().safeParse(value).success ? value : undefined} />; }
