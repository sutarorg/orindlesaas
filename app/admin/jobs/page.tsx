import type { Metadata } from "next";
import { JobsWorkspace } from "@/components/admin/jobs-workspace";

export const metadata: Metadata = { title: "Generation Jobs" };

export default async function AdminJobsPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const params = await searchParams;
  return <JobsWorkspace initialQuery={typeof params.q === "string" ? params.q : ""} />;
}
