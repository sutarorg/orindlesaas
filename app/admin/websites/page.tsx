import type { Metadata } from "next";
import { WebsitesWorkspace } from "@/components/admin/websites-workspace";

export const metadata: Metadata = { title: "Website Projects" };

export default function AdminWebsitesPage() {
  return <WebsitesWorkspace />;
}
