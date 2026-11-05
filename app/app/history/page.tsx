import type { Metadata } from "next";
import { z } from "zod";
import { HistoryWorkspace } from "@/components/dashboard/history-workspace";
import { requireUser } from "@/lib/server/auth/guards";
import { getWorkspaceSnapshot } from "@/lib/server/workspace/queries";
export const metadata: Metadata = { title: "Generation History" };
export const dynamic = "force-dynamic";
export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ job?: string | string[] }> }) {
  const identity = await requireUser();
  const [{ job }, data] = await Promise.all([searchParams, getWorkspaceSnapshot(identity.userId)]);
  const value = Array.isArray(job) ? job[0] : job;
  const initialJobId = value && z.uuid().safeParse(value).success && data.jobs.some((item) => item.id === value) ? value : undefined;
  return <HistoryWorkspace data={data} initialJobId={initialJobId} />;
}
