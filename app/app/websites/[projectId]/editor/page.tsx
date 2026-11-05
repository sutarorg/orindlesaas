import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { WebsiteEditor } from "@/components/dashboard/website-editor";
import { requireUser } from "@/lib/server/auth/guards";
import { getOwnedWebsite, websitePreviewDocument } from "@/lib/server/websites/projects";
export const metadata: Metadata = { title: "Website Editor" };
export const dynamic = "force-dynamic";
export default async function WebsiteEditorPage({ params }: { params: Promise<{ projectId: string }> }) {
  const identity = await requireUser(); const { projectId } = await params;
  if (!z.uuid().safeParse(projectId).success) notFound();
  const website = await getOwnedWebsite(identity.userId, projectId).catch(() => null);
  if (!website) notFound();
  return <WebsiteEditor website={website} previewDocument={websitePreviewDocument(website.files)} />;
}
