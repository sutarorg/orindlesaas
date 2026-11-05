import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WebsiteEditor } from "@/components/dashboard/website-editor";
import { getWebsiteFixture } from "@/lib/dashboard/fixtures";

export const metadata: Metadata = { title: "Website Editor" };

export default async function WebsiteEditorPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const website = getWebsiteFixture(projectId);
  if (!website) notFound();
  return <WebsiteEditor website={website} />;
}
