import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, siteConfig } from "@/lib/site";

export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <SiteHeader />
      {children}
      <SiteFooter />
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": absoluteUrl("/#organization"),
            name: "Orindle",
            url: absoluteUrl(),
            logo: absoluteUrl("/icon.svg"),
            description: siteConfig.description,
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": absoluteUrl("/#website"),
            name: "Orindle",
            url: absoluteUrl(),
            publisher: { "@id": absoluteUrl("/#organization") },
          },
        ]}
      />
    </>
  );
}
