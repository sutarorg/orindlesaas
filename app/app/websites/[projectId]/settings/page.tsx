import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { WebsiteSettings } from "@/components/dashboard/website-settings";
import { requireUser } from "@/lib/server/auth/guards";
import { getOwnedWebsite } from "@/lib/server/websites/projects";
export const metadata: Metadata = { title: "Website Settings" };
export const dynamic = "force-dynamic";
export default async function WebsiteSettingsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const identity = await requireUser(); const { projectId } = await params;
  if (!z.uuid().safeParse(projectId).success) notFound();
  const website = await getOwnedWebsite(identity.userId, projectId).catch(() => null);
  if (!website) notFound();
  return <WebsiteSettings website={website} />;
}
