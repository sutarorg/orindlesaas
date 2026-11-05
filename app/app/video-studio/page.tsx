import type { Metadata } from "next";
import { VideoStudio } from "@/components/dashboard/video-studio";

export const metadata: Metadata = { title: "Video Studio" };

export default function VideoStudioPage() {
  return <VideoStudio />;
}
