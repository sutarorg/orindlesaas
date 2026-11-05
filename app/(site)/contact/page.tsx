import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, CreditCard, MessageCircleQuestion } from "lucide-react";
import { PageHero } from "@/components/marketing/page-hero";
import { ContactForm } from "@/components/marketing/contact-form";
import { Container } from "@/components/layout/container";
import { createMetadata } from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "Contact Orindle",
  description: "Prepare a question for the Orindle team and find answers about products, pricing, credits and accessibility.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <main id="main-content">
      <PageHero eyebrow="Contact" title="Let’s make the next step clear." description="Ask about the platform, one-time credits or the kind of workflow you want to build. Validated messages are stored and queued for support delivery; the acceptance response does not claim that email delivery has completed." breadcrumbs={[{ name: "Contact", href: "/contact" }]} />
      <section className="py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            <ContactForm />
            <aside>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal">Start with a useful answer</p>
              <h2 className="mb-0 mt-4 font-display text-2xl font-semibold tracking-[-0.035em]">You may find it faster in the guides.</h2>
              <div className="mt-7 space-y-3">
                {[
                  { href: "/faq", icon: MessageCircleQuestion, title: "Frequently asked questions", text: "Products, accounts and the shared workspace." },
                  { href: "/credits-policy", icon: CreditCard, title: "Credits Policy", text: "One-time purchases, usage and consumer rights." },
                  { href: "/blog", icon: BookOpen, title: "Guides & insights", text: "Practical workflows across all four products." },
                ].map((item) => <Link key={item.href} href={item.href} className="group flex gap-4 rounded-2xl border border-line p-5 transition-colors hover:border-teal/40 hover:bg-soft"><item.icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-teal" /><div><h3 className="mb-0 font-display text-base font-semibold tracking-[-0.02em] group-hover:text-teal">{item.title}</h3><p className="mb-0 mt-1.5 text-xs leading-5 text-muted">{item.text}</p><span className="mt-3 flex items-center gap-1 text-xs font-semibold text-teal">Open resource <ArrowRight aria-hidden="true" className="size-3.5" /></span></div></Link>)}
              </div>
              <p className="mb-0 mt-6 text-xs leading-5 text-muted">A verified public support inbox has not been configured. No email address or expected response time is invented here.</p>
            </aside>
          </div>
        </Container>
      </section>
    </main>
  );
}
