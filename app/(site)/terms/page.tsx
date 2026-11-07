import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/marketing/legal-page";
import { createMetadata } from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "Terms of Service",
  description: "Review the Orindle Terms of Service to understand the conditions, responsibilities, and rules that apply when accessing and using the Orindle platform and its AI features.",
  path: "/terms",
  absoluteTitle: true,
  keywords: [
    "Orindle terms of service",
    "Orindle terms",
    "user agreement",
    "terms and conditions",
    "AI platform terms",
    "platform usage rules",
    "service agreement",
    "acceptable use policy",
    "user responsibilities",
  ],
});

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use" summary="The ground rules for using Orindle’s public content and, once connected, its account-based AI products. These terms preserve rights and obligations that cannot lawfully be excluded." updated="5 November 2026" path="/terms">
      <LegalSection id="acceptance" title="1. Acceptance and service status">
        <p>By accessing the public website, you agree to these terms to the extent applicable. If you use the future service for an organization, you must have authority to accept on its behalf.</p>
        <p>The current implementation is an informational frontend. Account creation, login, AI generation, payments, credit grants and website deployment are not operational. Preview pages and local adapters do not form a transaction or create an account.</p>
      </LegalSection>
      <LegalSection id="accounts" title="2. Accounts and acceptable use">
        <p>When accounts become available, provide accurate information, protect your credentials and remain responsible for activity under your account. Do not share access in violation of the applicable plan or attempt to bypass authorization.</p>
        <ul><li>Do not break the law, infringe rights or facilitate harm, fraud, harassment or exploitation.</li><li>Do not probe, disrupt or overload the service, evade rate limits or access another user’s content.</li><li>Do not upload malicious code or use generated websites to distribute malware, phishing or deceptive claims.</li><li>Do not misrepresent AI output as verified fact or use it to impersonate others unlawfully.</li><li>Follow applicable provider policies and any additional terms presented for a specific operation.</li></ul>
      </LegalSection>
      <LegalSection id="ai-output" title="3. AI inputs, outputs and human review">
        <p>AI output may be inaccurate, incomplete, biased, similar to other output or otherwise unsuitable. You are responsible for reviewing facts, sources, rights, accessibility, brand fit and legal compliance before relying on or publishing it.</p>
        <p>You retain whatever rights you hold in content you submit. Ownership and protectability of AI-generated material can vary by jurisdiction and circumstances; these terms do not promise exclusive ownership or noninfringement. Do not submit material you lack permission to use.</p>
      </LegalSection>
      <LegalSection id="credits" title="4. One-time credits and payments">
        <p>Creator, Pro and Studio are one-time credit packages, not recurring subscriptions. Credits are shared across the four products and different operations can consume different amounts. The <Link href="/credits-policy">Credits Policy</Link> forms part of these terms.</p>
        <p>No real checkout is connected to this frontend. In the production service, displayed pack details, applicable taxes and any operation estimate must be reviewed before confirmation. Payment fulfillment must come from verified server-side payment events, not a browser success page.</p>
      </LegalSection>
      <LegalSection id="intellectual-property" title="5. Orindle content and third-party services">
        <p>The Orindle brand, website design, original content and software are protected by applicable rights. You may use public guides for their intended informational purpose, but may not copy the service’s substantial design or content as a competing product without permission.</p>
        <p>Model, storage, payment and deployment providers may have separate terms. A link to an external resource is provided for context and does not imply control over or endorsement of every external page.</p>
      </LegalSection>
      <LegalSection id="availability" title="6. Availability, changes and suspension">
        <p>Features, model catalogs and prices may change, but any change to an existing purchase must be handled according to the disclosed terms and applicable law. We may restrict activity that threatens security, other users, legal compliance or service integrity, with appropriate notice and review processes where required.</p>
        <p>Planned functionality described on this frontend is not a guarantee of immediate availability. Exact production availability must be confirmed in the connected account experience.</p>
      </LegalSection>
      <LegalSection id="liability" title="7. Disclaimers and liability">
        <p>The public website is provided for general information. To the extent permitted by law, no guarantee is made that AI output or a generated website will be accurate, suitable for a particular purpose or continuously available.</p>
        <p>Nothing in these terms excludes liability or consumer rights that cannot lawfully be excluded or limited. Any production liability allocation requires qualified legal review and must be presented clearly before paid services launch.</p>
      </LegalSection>
      <LegalSection id="general" title="8. General terms and contact">
        <p>Material changes should be dated and communicated appropriately. Severability, assignment, governing-law and dispute-resolution language must be finalized with the operating entity’s details before commercial launch. Mandatory local consumer protections remain unaffected.</p>
        <p>See the <Link href="/privacy">Privacy Policy</Link> for data practices. The current <Link href="/contact">contact page</Link> is explicitly a non-delivering frontend preview.</p>
      </LegalSection>
    </LegalPage>
  );
}
