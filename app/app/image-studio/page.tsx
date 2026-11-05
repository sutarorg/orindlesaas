import type { Metadata } from "next";
import { ImageStudio } from "@/components/dashboard/image-studio";
import { requireUser } from "@/lib/server/auth/guards";
import { getWorkspaceSnapshot } from "@/lib/server/workspace/queries";
export const metadata: Metadata = { title: "Image Studio" };
export const dynamic = "force-dynamic";
export default async function ImageStudioPage() { const identity = await requireUser(); return <ImageStudio data={await getWorkspaceSnapshot(identity.userId)} />; }
