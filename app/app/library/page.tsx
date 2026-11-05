import type { Metadata } from "next";
import { LibraryWorkspace } from "@/components/dashboard/library-workspace";

export const metadata: Metadata = { title: "Library" };

export default function LibraryPage() {
  return <LibraryWorkspace />;
}
