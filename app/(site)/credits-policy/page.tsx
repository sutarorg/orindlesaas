import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/marketing/legal-page";
import { creditPacks } from "@/lib/content/pricing";
import { formatNumber } from "@/lib/utils";
import { createMetadata } from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "Credits Policy",
  description: "Understand Orindle one-time credit purchases, the shared wallet, variable AI usage, additional packs, disputes and statutory consumer rights.",
  path: "/credits-policy",
});

export default function CreditsPolicyPage() {
  return (
    <LegalPage title="Credits Policy" summary="How Orindle’s one-time credit packs and universal wallet are intended to work, with transparent usage limits and mandatory consumer rights preserved." updated="5 November 2026" path="/credits-policy">
      <LegalSection id="purchases" title="1. One-time credit purchases">
        <p>Orindle offers the following one-time packages. They do not renew monthly and are not subscriptions.</p>
        <div className="my-6 overflow-x-auto rounded-xl border border-line" role="region" aria-label="Credit package table" tabIndex={0}>
          <table className="w-full min-w-[460px] border-collapse text-left text-sm">
            <thead className="bg-soft"><tr><th scope="col" className="px-4 py-3 text-ink">Package</th><th scope="col" className="px-4 py-3 text-ink">One-time price</th><th scope="col" className="px-4 py-3 text-ink">Credits</th></tr></thead>
            <tbody className="divide-y divide-line">{creditPacks.map((pack) => <tr key={pack.id}><th scope="row" className="px-4 py-3 font-semibold text-ink">{pack.name}</th><td className="px-4 py-3">${pack.priceUsd} USD</td><td className="px-4 py-3">{formatNumber(pack.credits)}</td></tr>)}</tbody>
          </table>
        </div>
        <p>Hosted Dodo checkout presents the final total and applicable taxes. Credits are granted only after a signed webhook passes purchase, product, amount, currency and fulfillment validation; returning from checkout alone grants nothing.</p>
      </LegalSection>
      <LegalSection id="wallet" title="2. One universal wallet">
        <p>Credits are designed to be used across Orindle Chat, Image Studio, Video Studio and Websites under one Orindle account. There are no separate product-specific wallets or required monthly plans in this model.</p>
        <p>Credits are a usage unit, not cash, a bank deposit, an investment or a transferable financial product. They cannot be represented as earning interest or having a cash withdrawal value.</p>
      </LegalSection>
      <LegalSection id="value" title="3. Usage value and variable deductions">
        <p>One hundred credits represent $1 of customer-facing usage value. This conversion explains the usage unit; it does not make credits redeemable for cash and does not mean every operation costs the same.</p>
        <p>Different models and operations have different metered costs. Text, images, video and website-related operations can therefore deduct different credit amounts. Public pages do not promise a fixed number of generations for any pack.</p>
        <p>In the production system, prices and deductions must be calculated on the server using the active configuration and verified metered usage. The browser cannot authoritatively set the final deduction. Where feasible, an estimate should be shown before an operation, with actual usage recorded in the account history.</p>
      </LegalSection>
      <LegalSection id="additional" title="4. Additional packs, expiry and transfers">
        <p>You may purchase another one-time pack when you need more credits. There is no monthly reset because these are not recurring subscription allowances.</p>
        <p>No expiry, transfer or mixed-wallet consumption rule is implemented in this frontend. Any such production term must be decided, clearly disclosed before purchase and applied fairly in the ledger. It must not be introduced retroactively in a way that removes rights or purchased value contrary to applicable law.</p>
      </LegalSection>
      <LegalSection id="history" title="5. Usage history and corrections">
        <p>The planned usage history will provide a cross-product record of operations and credits used. If a technical error creates an incorrect deduction, the production support process should investigate the ledger and provider records, then apply an auditable correction where appropriate.</p>
        <p>Provider failures, interrupted jobs and estimated-versus-actual usage require explicit reconciliation rules before launch. A failed operation should not be presented as successfully completed.</p>
      </LegalSection>
      <LegalSection id="rights" title="6. Consumer rights, refunds and payment disputes">
        <p>Applicable statutory consumer rights, cancellation or withdrawal rights, payment dispute mechanisms and legally required remedies remain available where they apply. This policy does not claim that every purchase is final or that a refund is never possible.</p>
        <p>Eligibility and process can depend on factors such as local law, whether digital content or services have been supplied with required consent, the amount used, technical defects and the circumstances of the request. Any discretionary refund or credit correction process must be explained separately and must not reduce mandatory rights.</p>
        <p>If you believe a charge is unauthorized or incorrect, contact support with the purchase reference and do not include full payment details. You may also have rights through your payment provider or card issuer.</p>
      </LegalSection>
      <LegalSection id="changes" title="7. Changes and related terms">
        <p>Changes to credit pricing or terms should be dated and communicated appropriately. They must not undermine already purchased rights contrary to law. Server-side historical price versions and ledger records should preserve the ability to explain past transactions.</p>
        <p>Read this policy with the <Link href="/terms">Terms of Use</Link> and <Link href="/privacy">Privacy Policy</Link>. See <Link href="/pricing">Pricing</Link> for the public pack comparison.</p>
      </LegalSection>
    </LegalPage>
  );
}
