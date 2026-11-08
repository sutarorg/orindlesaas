import type { Metadata } from "next";
import { z } from "zod";
import { HistoryWorkspace } from "@/components/dashboard/history-workspace";
import { getRequestWorkspace } from "@/lib/server/workspace/request-cache";
export const metadata: Metadata = { title: "Generation History" };
export const dynamic = "force-dynamic";
export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ job?: string | string[] }> }) {
  const [{ job }, data] = await Promise.all([searchParams, getRequestWorkspace()]);
  const value = Array.isArray(job) ? job[0] : job;
  const initialJobId = value && z.uuid().safeParse(value).success && data.jobs.some((item) => item.id === value) ? value : undefined;
  return <HistoryWorkspace data={data} initialJobId={initialJobId} />;
}
