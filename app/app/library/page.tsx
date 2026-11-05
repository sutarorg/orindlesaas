import type { Metadata } from "next";
import { LibraryWorkspace } from "@/components/dashboard/library-workspace";
import { requireUser } from "@/lib/server/auth/guards";
import { getWorkspaceSnapshot } from "@/lib/server/workspace/queries";
export const metadata: Metadata = { title: "Library" };
export const dynamic = "force-dynamic";
export default async function LibraryPage() { const identity = await requireUser(); return <LibraryWorkspace data={await getWorkspaceSnapshot(identity.userId)} />; }
