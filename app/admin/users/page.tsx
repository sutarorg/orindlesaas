import type { Metadata } from "next";
import { UsersWorkspace } from "@/components/admin/users-workspace";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const params = await searchParams;
  return <UsersWorkspace initialQuery={typeof params.q === "string" ? params.q : ""} />;
}
