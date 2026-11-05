import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WebsiteSettings } from "@/components/dashboard/website-settings";
import { getWebsiteFixture } from "@/lib/dashboard/fixtures";

export const metadata: Metadata = { title: "Website Settings" };

export default async function WebsiteSettingsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const website = getWebsiteFixture(projectId);
  if (!website) notFound();
  return <WebsiteSettings website={website} />;
}
