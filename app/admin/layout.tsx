import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/server/auth/guards";
import { getDb } from "@/lib/server/db/client";
import { profiles } from "@/lib/server/db/schema";

export const metadata: Metadata = { title: "Operations admin", description: "Permission-checked Orindle administration and live operational records.", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const identity = await requireAdmin("admin:read");
  const [profile] = await getDb().select({ fullName: profiles.displayName, email: profiles.email }).from(profiles).where(eq(profiles.id, identity.userId)).limit(1);
  return <AdminShell profile={profile ?? { fullName: null, email: String(identity.claims.email ?? "Verified operator") }}>{children}</AdminShell>;
}
