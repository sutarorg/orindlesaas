import type { Metadata } from "next";
import { Overview, type OverviewState } from "@/components/dashboard/overview";

export const metadata: Metadata = { title: "Overview" };

function parseOverviewState(value: string | string[] | undefined): OverviewState {
  const state = Array.isArray(value) ? value[0] : value;
  return state === "empty" || state === "error" || state === "session-expired" || state === "unauthorized" ? state : "default";
}

export default async function AppOverviewPage({ searchParams }: { searchParams: Promise<{ state?: string | string[] }> }) {
  const { state } = await searchParams;
  return <Overview state={parseOverviewState(state)} />;
}
