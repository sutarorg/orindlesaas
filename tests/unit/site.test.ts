import { describe, expect, it } from "vitest";
import { absoluteUrl, createMetadata, siteUrl } from "@/lib/site";

 describe("site metadata", () => {
  it("builds canonical metadata and Open Graph values", () => {
    const metadata = createMetadata({ title: "Pricing", description: "One-time credit pricing.", path: "/pricing" });
    expect(metadata.alternates?.canonical).toBe(absoluteUrl("/pricing"));
    expect(metadata.openGraph).toMatchObject({ title: "Pricing", url: absoluteUrl("/pricing"), siteName: "Orindle" });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("supports explicit private-route noindex metadata", () => {
    const metadata = createMetadata({ title: "Login", description: "Account preview.", path: "/login", noindex: true });
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("uses an absolute HTTP(S) site origin", () => {
    expect(siteUrl).toMatch(/^https?:\/\//);
    expect(absoluteUrl("/blog")).toBe(`${siteUrl}/blog`);
  });
});
