import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Check, FlaskConical, Scale, Workflow } from "lucide-react";
import { PageHero } from "@/components/marketing/page-hero";
import { SectionHeading } from "@/components/marketing/section-heading";
import { FinalCta } from "@/components/marketing/final-cta";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { modelFamilies, modelPrinciples } from "@/lib/content/models";
import { createMetadata } from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "AI Models for Different Creative Tasks",
  description: "Learn how Orindle approaches GPT, Claude and Gemini model selection. Compare models by task, quality, credit use and your own evaluation.",
  path: "/models",
  keywords: ["GPT vs Claude vs Gemini", "AI model selection", "Orindle AI models"],
});

export default function ModelsPage() {
  return (
    <main id="main-content">
      <PageHero
        eyebrow="AI model ecosystem"
        title="Choose by the work, not the hype."
        description="Different models can respond differently to the same brief. Orindle’s planned model experience is designed to make that choice practical: start with your task, compare useful outputs and consider the credits involved."
        breadcrumbs={[{ name: "AI Models", href: "/models" }]}
        actions={<Button asChild><Link href="/blog/gpt-vs-claude-vs-gemini">Read the model guide <BookOpen aria-hidden="true" /></Link></Button>}
      >
        <div className="rounded-[24px] border border-line bg-white p-6 sm:p-8">
          <div className="flex items-center justify-between border-b border-line pb-5"><span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">A better selection loop</span><FlaskConical aria-hidden="true" className="size-5 text-teal" /></div>
          <ol className="mt-6 space-y-5">
          {["Define the task and quality bar", "Test representative source material", "Compare usefulness, credits and review"].map((step, index) => <li key={step} className="flex items-center gap-4"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-subtle font-display text-xs font-semibold text-teal">{index + 1}</span><span className="text-sm font-medium text-ink">{step}</span>{index < 2 && <span className="ml-auto hidden h-px w-10 bg-line sm:block" />}</li>)}
          </ol>
          <p className="mb-0 mt-7 rounded-xl bg-soft p-4 text-xs leading-5 text-muted">Model capabilities and catalog availability change. Evaluate the exact option available for your task rather than relying on a timeless ranking.</p>
        </div>
      </PageHero>

      <section className="py-20 sm:py-24">
        <Container>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading eyebrow="Planned model families" title="A choice you can reason about." description="These families are part of the planned Orindle ecosystem. They are not presented as connected or callable in this public frontend." />
            <span className="w-fit rounded-full border border-line bg-soft px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-teal">Status reviewed 5 Nov 2026</span>
          </div>
          <div className="mt-12 border-t border-line">
            {modelFamilies.map((model) => (
              <article key={model.name} className="grid gap-5 border-b border-line py-8 lg:grid-cols-[0.45fr_1fr_0.8fr] lg:gap-10">
                <div><h2 className="mb-0 font-display text-3xl font-semibold tracking-[-0.045em]">{model.name}</h2><p className="mb-0 mt-2 text-xs text-muted">{model.provider}</p></div>
                <div><p className="mb-0 text-sm leading-7 text-body">{model.summary}</p><span className="mt-4 inline-flex rounded-full bg-soft px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-teal">{model.status}</span></div>
                <ul className="space-y-2.5">{model.usefulFor.map((item) => <li key={item} className="flex items-center gap-2 text-sm text-body"><Check aria-hidden="true" className="size-4 text-teal" />{item}</li>)}</ul>
              </article>
            ))}
          </div>
          <p className="mb-0 mt-5 text-xs leading-5 text-muted">Exact model IDs, features, pricing and availability must be verified against the launch configuration and current provider documentation. No benchmark ranking is claimed here.</p>
        </Container>
      </section>

      <section className="border-y border-line bg-soft py-20 sm:py-24">
        <Container>
          <SectionHeading eyebrow="The selection framework" title="Three principles before you press generate." />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {modelPrinciples.map((principle, index) => { const icons = [Workflow, FlaskConical, Scale]; const Icon = icons[index] ?? Workflow; return <article key={principle.title} className="rounded-2xl border border-line bg-white p-7"><Icon aria-hidden="true" className="size-5 text-teal" /><h3 className="mb-0 mt-8 font-display text-xl font-semibold tracking-[-0.03em]">{principle.title}</h3><p className="mb-0 mt-3 text-sm leading-6 text-body">{principle.description}</p></article>; })}
          </div>
        </Container>
      </section>

      <section className="py-20 sm:py-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
            <SectionHeading eyebrow="A task-based starting point" title="Questions worth asking." description="Use these prompts to structure your own evaluation. They are not claims that one family always wins a category." />
            <div className="overflow-x-auto rounded-2xl border border-line" tabIndex={0} role="region" aria-label="Model evaluation questions table">
              <table className="w-full min-w-[620px] border-collapse text-left text-sm">
                <caption className="sr-only">Task-based questions for evaluating AI models</caption>
                <thead className="bg-soft"><tr><th scope="col" className="px-5 py-4 font-semibold text-ink">Task</th><th scope="col" className="px-5 py-4 font-semibold text-ink">What to compare</th><th scope="col" className="px-5 py-4 font-semibold text-ink">Watch for</th></tr></thead>
                <tbody className="divide-y divide-line">
                  {[
                    ["Long-form writing", "Structure, voice and fidelity to the brief", "Generic phrasing and unsupported additions"],
                    ["Provided-document analysis", "Coverage, attribution and accurate synthesis", "Missed caveats and invented citations"],
                    ["Multimodal exploration", "Use of visual details and instruction following", "Confident misreadings and inconsistent output"],
                    ["Creative iteration", "Range of useful alternatives and controllability", "Variation without meaningful improvement"],
                  ].map((row) => <tr key={row[0]}>{row.map((cell, index) => index === 0 ? <th key={cell} scope="row" className="px-5 py-5 align-top font-semibold text-ink">{cell}</th> : <td key={cell} className="px-5 py-5 align-top leading-6 text-body">{cell}</td>)}</tr>)}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-10 rounded-2xl bg-[#eef7f2] p-6 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-8"><div><h3 className="mb-0 font-display text-xl font-semibold tracking-[-0.03em]">Want the complete evaluation workflow?</h3><p className="mb-0 mt-2 text-sm leading-6 text-body">Build a small test set and compare GPT, Claude and Gemini without relying on invented winners.</p></div><Button asChild variant="secondary" className="mt-5 shrink-0 sm:mt-0"><Link href="/blog/gpt-vs-claude-vs-gemini">Read the comparison <ArrowRight aria-hidden="true" /></Link></Button></div>
        </Container>
      </section>
      <FinalCta title="Let the task lead. Let the workspace keep up." description="Explore a model-flexible way to develop conversations, images, video and websites." />
    </main>
  );
}
