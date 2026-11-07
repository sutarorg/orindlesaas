import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/marketing/legal-page";
import { createMetadata } from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "Privacy Policy",
  description: "Read the Orindle Privacy Policy to understand how personal information is collected, used, stored, and protected when you access or use our AI platform.",
  path: "/privacy",
  absoluteTitle: true,
  keywords: [
    "Orindle privacy policy",
    "data privacy",
    "data protection",
    "personal information protection",
    "user privacy",
    "online privacy policy",
    "information security",
    "AI platform privacy",
    "privacy practices",
  ],
});

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" summary="A clear explanation of the information Orindle’s public frontend does—and does not—handle today, and the privacy boundaries required for the future connected workspace." updated="5 November 2026" path="/privacy">
      <LegalSection id="scope" title="1. Scope and current service status">
        <p>This policy describes the Orindle public website and the planned account-based services for Orindle Chat, Image Studio, Video Studio and Websites. The current implementation is a public frontend only: it has no live account system, AI generation, payment processing, analytics service or contact-message delivery.</p>
        <p>The local contact preview validates entries in your browser and explicitly reports that no message was sent or stored by Orindle. Do not include sensitive personal or confidential information in a preview form.</p>
      </LegalSection>
      <LegalSection id="information" title="2. Information the future service may handle">
        <p>Before those features launch, this policy must be updated with actual configured data flows and retention periods. Categories expected for the connected product include:</p>
        <ul><li>Account details such as email address, authentication identifiers and settings.</li><li>Project content, prompts, generated outputs, uploaded assets and website configuration.</li><li>Usage events, credit ledger entries and transaction references needed to operate the shared wallet.</li><li>Technical and security logs such as request time, IP-derived information, device/browser data and error identifiers.</li><li>Support correspondence and consent records where applicable.</li></ul>
        <p>Payment card details should be handled by the configured payment provider rather than stored directly by Orindle, subject to the final integration review.</p>
      </LegalSection>
      <LegalSection id="use" title="3. Why information may be used">
        <p>Future processing should be limited to providing and securing the service, authenticating users, maintaining projects and assets, metering usage, processing purchases, preventing abuse, delivering requested support, meeting legal obligations and improving clearly understood product behavior.</p>
        <p>Any use of customer content to train models must be disclosed accurately and governed by the actual provider terms and product settings. This frontend makes no claim that customer content is or is not used for training because no AI integration is connected.</p>
      </LegalSection>
      <LegalSection id="cookies" title="4. Cookies and local storage">
        <p>This public frontend does not intentionally install analytics, advertising or third-party tracking cookies. Future authentication requires secure session cookies. If nonessential analytics or similar technologies are introduced, the production site must provide appropriate notice and consent controls where required.</p>
      </LegalSection>
      <LegalSection id="providers" title="5. Service providers and sharing">
        <p>The confirmed future architecture includes Supabase, Vercel, Cloudflare R2, Inngest, E2B, Dodo Payments, Upstash, Resend and AI providers accessed through Vercel AI Gateway. Their actual roles, enabled services, data locations and subprocessor terms must be verified before launch and reflected in an updated disclosure.</p>
        <p>Information should not be sold. Sharing should be limited to service operation, legal requirements, safety, business transfers with appropriate notice, or instructions from the user.</p>
      </LegalSection>
      <LegalSection id="retention" title="6. Retention, deletion and security">
        <p>Production retention periods must be specific to account records, projects, generated media, backups, payment records and security logs. Users should receive workable export and deletion paths subject to legally required retention.</p>
        <p>Later-stage safeguards include server authorization, object-level ownership checks, secure session handling, encrypted transport, restricted secrets, signed media access, auditable credit records and rate limiting. No online service can promise absolute security.</p>
      </LegalSection>
      <LegalSection id="rights" title="7. Your rights and choices">
        <p>Depending on where you live, you may have rights to access, correct, export, delete or restrict certain personal information, object to some processing, withdraw consent and lodge a complaint with a relevant authority. These rights are not waived by this policy.</p>
        <p>A verified privacy contact and entity details must be published before production launch. The current <Link href="/contact">contact page</Link> is a local preview and cannot deliver a privacy request.</p>
      </LegalSection>
      <LegalSection id="children" title="8. Children and changes">
        <p>The service is not directed to children, and the final minimum-age requirement must be confirmed against the markets served and provider terms. Material changes to this policy should be dated and, where required, communicated with an appropriate opportunity to review or choose.</p>
      </LegalSection>
    </LegalPage>
  );
}
