import type { Metadata } from "next";
import { VideoStudio } from "@/components/dashboard/video-studio";
import { getRequestWorkspace } from "@/lib/server/workspace/request-cache";
export const metadata: Metadata = { title: "Video Studio" };
export const dynamic = "force-dynamic";
export default async function VideoStudioPage() { const data = await getRequestWorkspace(); return <VideoStudio data={data} />; }
