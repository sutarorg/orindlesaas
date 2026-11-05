import type { Metadata } from "next";
import { VideoStudio } from "@/components/dashboard/video-studio";
import { requireUser } from "@/lib/server/auth/guards";
import { getWorkspaceSnapshot } from "@/lib/server/workspace/queries";
export const metadata: Metadata = { title: "Video Studio" };
export const dynamic = "force-dynamic";
export default async function VideoStudioPage() { const identity = await requireUser(); return <VideoStudio data={await getWorkspaceSnapshot(identity.userId)} />; }
