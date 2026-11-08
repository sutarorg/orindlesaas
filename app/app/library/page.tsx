import type { Metadata } from "next";
import { LibraryWorkspace } from "@/components/dashboard/library-workspace";
import { getRequestWorkspace } from "@/lib/server/workspace/request-cache";
export const metadata: Metadata = { title: "Library" };
export const dynamic = "force-dynamic";
export default async function LibraryPage() { const data = await getRequestWorkspace(); return <LibraryWorkspace data={data} />; }
