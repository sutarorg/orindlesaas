import type { Metadata } from "next";
import { WebsitesOverview } from "@/components/dashboard/websites-overview";

export const metadata: Metadata = { title: "Websites" };

export default function WebsitesPage() {
  return <WebsitesOverview />;
}
