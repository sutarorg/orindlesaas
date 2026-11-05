import {
  ArrowRight,
  ArrowUpRight,
  Coins,
  FileText,
  Globe2,
  Image as ImageIcon,
  Lightbulb,
  MessagesSquare,
  Plus,
  Sparkles,
  Video,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { MotionReveal } from "@/components/marketing/motion-reveal";
import { DemoBadge, EmptyState, InlineNotice, Panel, StatusBadge } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import type { ProductId } from "@/lib/contracts/dashboard";
import { workspaceFixture } from "@/lib/dashboard/fixtures";
import { formatCredits, productLabels } from "@/lib/dashboard/format";
import { getModel } from "@/lib/dashboard/models";

export type OverviewState = "default" | "empty" | "error" | "session-expired" | "unauthorized";

const products: { id: ProductId; name: string; description: string; action: string; href: string; icon: LucideIcon; className: string }[] = [
  { id: "chat", name: "Chat", description: "Think through ideas, research and structured creative briefs.", action: "Start a conversation", href: "/app/chat", icon: MessagesSquare, className: "bg-[#eaf6f0] text-teal-dark" },
  { id: "image", name: "Image Studio", description: "Explore product, editorial and campaign image directions.", action: "Create an image", href: "/app/image-studio", icon: ImageIcon, className: "bg-cyan-soft text-[#17677a]" },
  { id: "video", name: "Video Studio", description: "Shape short motion concepts from text or a reference frame.", action: "Plan a video", href: "/app/video-studio", icon: Video, className: "bg-purple-soft text-[#684493]" },
  { id: "website", name: "Websites", description: "Move from a focused brief to an editable website concept.", action: "Build a website", href: "/app/websites", icon: Globe2, className: "bg-blue-soft text-[#3c5f9d]" },
];

const projectImages: Record<string, string> = {
  "project-launch": "/fixtures/mint-product.jpg",
  "project-retreat": "/fixtures/retreat-architecture.jpg",
  "project-ceramics": "/fixtures/ceramic-collection.jpg",
};

function ProductEntries() {
  return (
    <section aria-labelledby="create-heading" className="mt-9">
      <div className="mb-4 flex items-end justify-between gap-4"><div><p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-teal">Create with Orindle</p><h2 id="create-heading" className="text-xl font-semibold tracking-[-0.03em]">One workspace, four ways to make</h2></div></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {products.map((product, index) => {
          const Icon = product.icon;
          return (
            <MotionReveal key={product.id} delay={index * 0.05}>
              <Link href={product.href} className="group flex h-full min-h-56 flex-col rounded-3xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(21,25,24,0.02)] transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-teal/25 hover:shadow-[0_14px_35px_rgba(21,25,24,0.06)]">
                <span className={`mb-5 grid size-11 place-items-center rounded-2xl ${product.className}`}><Icon className="size-5" aria-hidden="true" /></span>
                <h3 className="mb-2 text-base font-semibold tracking-[-0.02em]">{product.name}</h3>
                <p className="mb-5 text-sm leading-6 text-body">{product.description}</p>
                <span className="mt-auto flex items-center justify-between text-xs font-semibold text-ink">{product.action}<ArrowUpRight className="size-4 text-teal transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" /></span>
              </Link>
            </MotionReveal>
          );
        })}
      </div>
    </section>
  );
}

function StatePresentation({ state }: { state: Exclude<OverviewState, "default"> }) {
  if (state === "empty") {
    return <div className="mt-8"><EmptyState title="Your workspace story starts here" description="This empty-state fixture contains no recent projects or generations. Choose a product above to explore the creation flow; no work will be saved." action={{ label: "Start with Chat", href: "/app/chat" }} icon={<Sparkles aria-hidden="true" />} /></div>;
  }
  if (state === "error") {
    return <div className="mt-8"><EmptyState title="The workspace fixture couldn’t be displayed" description="This is a deliberate load-error presentation, not a backend failure. Retrying simply returns to the default local fixture." action={{ label: "Retry fixture view", href: "/app" }} /></div>;
  }
  const session = state === "session-expired";
  return (
    <div className="mt-8 space-y-4">
      <InlineNotice title={session ? "Session-expiry design fixture" : "Unauthorized-state design fixture"} tone="warning">
        {session ? "No session existed or expired. This screen only previews how a future verified-session state could look." : "No authorization check ran and no private record was requested. This screen only previews a future access-denied state."}
      </InlineNotice>
      <EmptyState title={session ? "Your demo session isn’t a real session" : "Private workspace data stays private"} description={session ? "Return to the local overview, or view the public sign-in design without expecting authentication." : "Return to the fixture overview. Route visibility in this demo is not route protection."} action={{ label: "Return to demo overview", href: "/app" }} />
      {!session && <p className="text-center text-xs text-muted">Prompt 5 must add verified server identity and per-object authorization.</p>}
    </div>
  );
}

export function Overview({ state = "default" }: { state?: OverviewState }) {
  const recentProjects = workspaceFixture.projects.slice(0, 3);
  const recentGenerations = workspaceFixture.generations.slice(0, 4);
  const highlightModels = ["gpt-6.1-sol", "gemini-3.1-flash-image", "gemini-omni-1.1-flash"].map(getModel).filter((model) => model !== null);

  return (
    <>
      <MotionReveal>
        <section className="relative overflow-hidden rounded-[28px] border border-teal/10 bg-[#eaf5ef] px-6 py-8 sm:px-9 sm:py-10 lg:px-11">
          <div className="pointer-events-none absolute -right-24 -top-32 size-80 rounded-full border border-teal/10" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-10 -top-20 size-52 rounded-full border border-teal/10" aria-hidden="true" />
          <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div>
              <DemoBadge label="Personalized demo workspace" />
              <h1 className="mb-4 mt-5 max-w-2xl text-[clamp(2rem,5vw,3.45rem)] font-semibold leading-[1.08] tracking-[-0.055em]">Good afternoon, {workspaceFixture.profile.name}.<br /><span className="text-teal-dark">What will you create?</span></h1>
              <p className="max-w-xl text-[15px] leading-7 text-body">Move from an early thought to images, motion and a website—without losing the thread of your project.</p>
              <div className="mt-7 flex flex-wrap gap-3"><Button asChild size="lg"><Link href="/app/chat"><MessagesSquare aria-hidden="true" />Start a conversation</Link></Button><Button asChild size="lg" variant="secondary"><Link href="/app/library">Explore library<ArrowRight aria-hidden="true" /></Link></Button></div>
            </div>
            <div className="rounded-3xl border border-white/80 bg-white/80 p-5 shadow-[0_18px_50px_rgba(7,95,81,0.08)] backdrop-blur-sm">
              <div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Universal wallet</span><Coins className="size-5 text-teal" aria-hidden="true" /></div>
              <p className="mt-4 font-display text-4xl font-semibold tracking-[-0.05em] text-ink">{formatCredits(workspaceFixture.wallet.balance)}</p>
              <p className="mt-1 text-sm text-body">demo credits available</p>
              <Button asChild variant="mint" className="mt-5 w-full"><Link href="/app/credits#packs"><Plus aria-hidden="true" />Buy credits</Link></Button>
              <p className="mt-3 text-center text-[11px] leading-4 text-muted">Illustrative balance. Purchases are preview-only.</p>
            </div>
          </div>
        </section>
      </MotionReveal>

      <ProductEntries />
      {state !== "default" ? <StatePresentation state={state} /> : (
        <>
          <div className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]">
            <section aria-labelledby="recent-projects-heading">
              <div className="mb-4 flex items-center justify-between"><h2 id="recent-projects-heading" className="text-xl font-semibold tracking-[-0.03em]">Recent projects</h2><Link href="/app/projects" className="flex min-h-10 items-center gap-1 text-xs font-semibold text-teal-dark hover:underline">View all<ArrowRight className="size-3.5" aria-hidden="true" /></Link></div>
              <div className="grid gap-4 sm:grid-cols-3">
                {recentProjects.map((project) => (
                  <Link key={project.id} href={project.product === "website" ? "/app/websites/site-stillwater/editor" : `/app/projects?project=${project.id}`} className="group overflow-hidden rounded-3xl border border-line bg-white transition-[border-color,box-shadow] hover:border-teal/25 hover:shadow-[0_12px_30px_rgba(21,25,24,0.06)]">
                    <div className="relative aspect-[4/3] overflow-hidden bg-subtle"><Image src={projectImages[project.id] ?? "/fixtures/mint-product.jpg"} alt="" fill sizes="(max-width: 640px) 100vw, 280px" className="object-cover transition-transform duration-500 group-hover:scale-[1.025]" /><span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-teal-dark backdrop-blur">Fixture</span></div>
                    <div className="p-4"><p className="text-[11px] font-medium text-teal">{productLabels[project.product]}</p><h3 className="mb-1.5 mt-1 text-sm font-semibold tracking-[-0.015em]">{project.name}</h3><p className="text-[11px] text-muted">Updated {project.updatedLabel}</p></div>
                  </Link>
                ))}
              </div>
            </section>
            <Panel className="h-fit">
              <div className="mb-5 flex items-center gap-2"><Lightbulb className="size-5 text-teal" aria-hidden="true" /><h2 className="text-lg font-semibold tracking-[-0.025em]">Suggested next steps</h2></div>
              <ul className="space-y-2">
                <li><Link href="/app/websites/site-stillwater/editor" className="flex min-h-14 items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-soft"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-soft text-[#3c5f9d]"><Globe2 className="size-4" aria-hidden="true" /></span><span className="flex-1 text-sm font-medium text-ink">Continue Stillwater website</span><ArrowRight className="size-4 text-muted" aria-hidden="true" /></Link></li>
                <li><Link href="/app/video-studio#jobs" className="flex min-h-14 items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-soft"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-purple-soft text-[#684493]"><Video className="size-4" aria-hidden="true" /></span><span className="flex-1 text-sm font-medium text-ink">Review motion job fixtures</span><ArrowRight className="size-4 text-muted" aria-hidden="true" /></Link></li>
                <li><Link href="/app/chat" className="flex min-h-14 items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-soft"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#eaf6f0] text-teal"><WandSparkles className="size-4" aria-hidden="true" /></span><span className="flex-1 text-sm font-medium text-ink">Draft a creative brief</span><ArrowRight className="size-4 text-muted" aria-hidden="true" /></Link></li>
              </ul>
            </Panel>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,1fr)]">
            <Panel>
              <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold tracking-[-0.025em]">Recent generations</h2><Link href="/app/history" className="text-xs font-semibold text-teal-dark hover:underline">Full history</Link></div>
              <ul className="divide-y divide-line">
                {recentGenerations.map((generation) => (
                  <li key={generation.id} className="flex flex-col gap-3 py-4 first:pt-1 last:pb-0 sm:flex-row sm:items-center">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-subtle text-teal">{generation.product === "video" ? <Video className="size-4" aria-hidden="true" /> : generation.product === "image" ? <ImageIcon className="size-4" aria-hidden="true" /> : <FileText className="size-4" aria-hidden="true" />}</span>
                    <div className="min-w-0 flex-1"><Link href={generation.product === "video" ? "/app/video-studio#jobs" : generation.product === "image" ? "/app/image-studio#results" : "/app/history"} className="text-sm font-semibold text-ink hover:text-teal-dark">{generation.title}</Link><p className="mt-1 text-xs text-muted">{productLabels[generation.product]} · {generation.createdLabel}</p></div>
                    <StatusBadge status={generation.status} />
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel>
              <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold tracking-[-0.025em]">Usage at a glance</h2><DemoBadge label="This month · fixture" /></div>
              <p className="mb-5 font-display text-3xl font-semibold tracking-[-0.04em] text-ink">{formatCredits(workspaceFixture.wallet.usedThisMonth)} <span className="text-sm font-medium text-body">credits used</span></p>
              <ul className="space-y-3">
                {products.map((product) => <li key={product.id} className="flex items-center justify-between gap-4 text-sm"><span className="flex items-center gap-2 text-body"><product.icon className="size-4 text-muted" aria-hidden="true" />{product.name}</span><span className="font-semibold text-ink">{formatCredits(workspaceFixture.wallet.byProduct[product.id])}</span></li>)}
              </ul>
              <Link href="/app/credits/history" className="mt-5 flex min-h-10 items-center justify-center rounded-xl border border-line text-xs font-semibold text-ink hover:bg-soft">View illustrative transactions</Link>
            </Panel>
          </div>

          <section aria-labelledby="models-heading" className="mt-10">
            <div className="mb-4"><p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-teal">Model catalogue</p><h2 id="models-heading" className="text-xl font-semibold tracking-[-0.03em]">A useful model for each medium</h2><p className="mt-2 text-sm text-body">Officially documented IDs in a local catalogue fixture—not connected provider access.</p></div>
            <div className="grid gap-4 lg:grid-cols-3">
              {highlightModels.map((model) => <Link key={model.id} href={model.products.includes("image") ? "/app/image-studio" : model.products.includes("video") ? "/app/video-studio" : "/app/chat"} className="rounded-3xl border border-line bg-white p-5 transition-colors hover:border-teal/30"><div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold text-teal">{model.provider}</span><ArrowUpRight className="size-4 text-muted" aria-hidden="true" /></div><h3 className="mb-1 mt-3 text-base font-semibold">{model.displayName}</h3><code className="text-[11px] text-muted">{model.id}</code><p className="mt-3 text-xs leading-5 text-body">{model.contextDisplay ?? `${model.inputModalities.join(", ")} → ${model.outputModalities.join(", ")}`}</p><div className="mt-3 flex flex-wrap gap-1.5">{model.featureTags.slice(0, 2).map((tag) => <span key={tag} className="rounded-full bg-subtle px-2 py-1 text-[10px] font-medium text-body">{tag}</span>)}</div></Link>)}
            </div>
          </section>
        </>
      )}
    </>
  );
}
