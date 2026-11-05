import type { Metadata } from "next";
import { ImageStudio } from "@/components/dashboard/image-studio";

export const metadata: Metadata = { title: "Image Studio" };

export default function ImageStudioPage() {
  return <ImageStudio />;
}
