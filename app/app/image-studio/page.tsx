import type { Metadata } from "next";
import { ImageStudio } from "@/components/dashboard/image-studio";
import { getRequestWorkspace } from "@/lib/server/workspace/request-cache";
export const metadata: Metadata = { title: "Image Studio" };
export const dynamic = "force-dynamic";
export default async function ImageStudioPage() { const data = await getRequestWorkspace(); return <ImageStudio data={data} />; }
