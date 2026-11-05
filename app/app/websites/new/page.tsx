import type { Metadata } from "next";
import { NewWebsite } from "@/components/dashboard/new-website";

export const metadata: Metadata = { title: "New Website" };

export default function NewWebsitePage() {
  return <NewWebsite />;
}
