import { ArrowRight, Check, Image as ImageIcon, MessageSquareText, MousePointer2, PanelsTopLeft, Play, Sparkles, Video, WandSparkles } from "lucide-react";
import type { ProductId } from "@/lib/content/products";
import { cn } from "@/lib/utils";

function VisualLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted">{children}</span>;
}

export function ChatVisual({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-[22px] border border-line bg-cyan-soft p-3 sm:p-5", className)}>
      <div className="rounded-[16px] border border-ink/8 bg-white shadow-[0_16px_40px_rgba(21,25,24,0.06)]">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="flex items-center gap-2 text-xs font-semibold text-ink"><MessageSquareText aria-hidden="true" className="size-4 text-teal" /> Campaign thinking</span>
          <VisualLabel>Concept</VisualLabel>
        </div>
        <div className="space-y-4 p-4 sm:p-5">
          <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-ink px-4 py-3 text-xs leading-5 text-white">Turn our quiet-luxury skincare idea into a launch direction.</div>
          <div className="max-w-[92%]">
            <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold text-teal"><Sparkles aria-hidden="true" className="size-3.5" /> A clearer creative brief</p>
            <div className="space-y-2 rounded-xl border border-line bg-soft p-3.5">
              {["Lead with tactile, everyday rituals", "Use soft daylight and honest textures", "Build one story across image, motion and web"].map((item) => (
                <p key={item} className="m-0 flex items-start gap-2 text-[11px] leading-5 text-body"><Check aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-teal" />{item}</p>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-line pt-3 text-[10px] text-muted"><span>Brief ready for the next step</span><ArrowRight aria-hidden="true" className="size-3.5 text-teal" /></div>
        </div>
      </div>
    </div>
  );
}

export function ImageVisual({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-[22px] border border-line bg-[#edf8f1] p-3 sm:p-5", className)}>
      <div className="grid gap-3 sm:grid-cols-[1.25fr_0.75fr]">
        <div className="relative min-h-[270px] overflow-hidden rounded-[16px] bg-[#d8eadc] sm:min-h-[330px]">
          <div aria-hidden="true" className="absolute left-[12%] top-[13%] size-24 rounded-full bg-[#fff7dc] shadow-[0_0_0_18px_rgba(255,255,255,0.16)] sm:size-28" />
          <div aria-hidden="true" className="absolute -bottom-[12%] -left-[8%] h-[70%] w-[75%] rotate-12 rounded-[50%_50%_0_0] bg-[#71ab8a]" />
          <div aria-hidden="true" className="absolute -bottom-[20%] right-[-18%] h-[85%] w-[80%] -rotate-12 rounded-[50%_50%_0_0] bg-[#2d6d57]" />
          <div aria-hidden="true" className="absolute bottom-[14%] left-[44%] h-[42%] w-[12%] rounded-t-full bg-[#f4eee1] shadow-[12px_12px_0_rgba(21,25,24,0.08)]" />
          <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.13em] text-teal-dark">Selected direction</span>
          <span className="absolute bottom-4 left-4 rounded-md bg-white/90 px-2.5 py-1 text-[9px] text-body">Soft daylight · natural forms</span>
        </div>
        <div className="flex flex-col gap-3">
          <div className="rounded-[14px] border border-ink/8 bg-white p-4">
            <div className="flex items-center justify-between"><VisualLabel>Prompt anatomy</VisualLabel><WandSparkles aria-hidden="true" className="size-3.5 text-teal" /></div>
            <p className="mb-0 mt-3 text-[11px] leading-5 text-body">A quiet botanical still life, sculptural vessel, morning light, editorial composition.</p>
            <div className="mt-4 flex flex-wrap gap-1.5">{["Subject", "Light", "Composition"].map((item) => <span key={item} className="rounded-full bg-subtle px-2 py-1 text-[9px] font-medium text-body">{item}</span>)}</div>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-2">
            {[0, 1].map((item) => <div key={item} className={cn("min-h-20 rounded-[12px] border-2", item === 0 ? "border-teal bg-[#c7e3d2]" : "border-white bg-[#e6d9c7]")}><span className="sr-only">Variation {item + 1}</span></div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

export function VideoVisual({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-[22px] border border-line bg-purple-soft p-3 sm:p-5", className)}>
      <div className="overflow-hidden rounded-[16px] border border-ink/8 bg-white">
        <div className="flex items-center justify-between border-b border-line px-4 py-3"><span className="flex items-center gap-2 text-xs font-semibold text-ink"><Video aria-hidden="true" className="size-4 text-[#7452a3]" /> Three-shot sequence</span><VisualLabel>Storyboard</VisualLabel></div>
        <div className="grid grid-cols-3 gap-2 p-3 sm:gap-3 sm:p-4">
          {["Establish", "Detail", "Resolve"].map((label, index) => (
            <div key={label}>
              <div className={cn("relative aspect-[4/3] overflow-hidden rounded-lg", index === 0 && "bg-[#cbd9d0]", index === 1 && "bg-[#e8d8c5]", index === 2 && "bg-[#cdc4df]")}>
                <div aria-hidden="true" className={cn("absolute rounded-full bg-white/55", index === 0 && "left-[18%] top-[18%] size-10", index === 1 && "bottom-[-15%] left-[20%] size-20", index === 2 && "right-[12%] top-[15%] size-12")} />
                <span className="absolute bottom-2 left-2 flex size-5 items-center justify-center rounded-full bg-white/85"><Play aria-hidden="true" className="ml-px size-2.5 fill-ink text-ink" /></span>
              </div>
              <p className="mb-0 mt-2 text-[9px] font-semibold uppercase tracking-[0.1em] text-muted sm:text-[10px]">0{index + 1} · {label}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-line px-4 py-4">
          <div className="mb-3 flex items-center justify-between text-[9px] text-muted"><span>Sequence timeline</span><span>00:12</span></div>
          <div className="flex h-8 gap-1">
            <span className="w-[38%] rounded-sm bg-[#b8a4d4]" /><span className="w-[27%] rounded-sm bg-[#d2c3e5]" /><span className="w-[35%] rounded-sm bg-[#a9d9c4]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function WebsiteVisual({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-[22px] border border-line bg-blue-soft p-3 sm:p-5", className)}>
      <div className="overflow-hidden rounded-[16px] border border-ink/8 bg-white shadow-[0_16px_40px_rgba(21,25,24,0.05)]">
        <div className="flex items-center gap-1.5 border-b border-line px-4 py-3"><span className="size-1.5 rounded-full bg-line" /><span className="size-1.5 rounded-full bg-line" /><span className="size-1.5 rounded-full bg-line" /><span className="ml-auto text-[9px] text-muted">Responsive concept</span></div>
        <div className="p-5 sm:p-7">
          <div className="flex items-center justify-between"><PanelsTopLeft aria-hidden="true" className="size-4 text-[#426a9c]" /><div className="flex gap-3"><span className="h-1 w-7 bg-line" /><span className="h-1 w-7 bg-line" /><span className="h-1 w-7 bg-line" /></div></div>
          <div className="mt-7 grid items-center gap-5 sm:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="mb-2 text-[8px] font-semibold uppercase tracking-[0.16em] text-teal">A considered digital home</p>
              <p className="mb-0 font-display text-[clamp(1.1rem,3vw,1.8rem)] font-semibold leading-[1.12] tracking-[-0.05em] text-ink">Your work,<br />beautifully clear.</p>
              <div className="mt-4 h-7 w-20 rounded-full bg-ink" />
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#e8eee8]">
              <div aria-hidden="true" className="absolute bottom-[-25%] right-[-5%] size-32 rounded-full bg-[#a5cbb4]" />
              <MousePointer2 aria-hidden="true" className="absolute bottom-4 left-4 size-4 fill-white text-ink" />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-2 border-t border-line pt-4">{[1, 2, 3].map((item) => <div key={item} className="space-y-1.5"><span className="block h-1 w-3/4 bg-line" /><span className="block h-1 w-1/2 bg-subtle" /></div>)}</div>
        </div>
      </div>
    </div>
  );
}

export function ProductVisual({ id, className }: { id: ProductId; className?: string }) {
  if (id === "chat") return <ChatVisual className={className} />;
  if (id === "image") return <ImageVisual className={className} />;
  if (id === "video") return <VideoVisual className={className} />;
  return <WebsiteVisual className={className} />;
}

export function EcosystemVisual() {
  return (
    <figure className="m-0">
      <div className="relative rounded-[26px] border border-line bg-soft p-3 shadow-[0_24px_70px_rgba(21,25,24,0.07)] sm:p-5">
        <div className="mb-3 flex items-center justify-between px-1 pt-1">
          <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink"><span className="size-2 rounded-full bg-mint-strong" /> One connected project</span>
          <VisualLabel>Illustrative workflow</VisualLabel>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[16px] border border-line bg-white p-4">
            <div className="flex items-center justify-between"><MessageSquareText aria-hidden="true" className="size-4 text-teal" /><span className="text-[9px] font-semibold uppercase tracking-[0.13em] text-muted">01 · Chat</span></div>
            <p className="mb-3 mt-5 text-xs font-semibold leading-5 text-ink">“A quieter kind of launch.”</p>
            <div className="space-y-1.5"><span className="block h-1.5 w-full rounded-full bg-subtle" /><span className="block h-1.5 w-4/5 rounded-full bg-subtle" /><span className="block h-1.5 w-3/5 rounded-full bg-mint" /></div>
            <p className="mb-0 mt-4 text-[10px] text-teal">Brief shaped</p>
          </div>
          <div className="rounded-[16px] border border-line bg-white p-4">
            <div className="flex items-center justify-between"><ImageIcon aria-hidden="true" className="size-4 text-teal" /><span className="text-[9px] font-semibold uppercase tracking-[0.13em] text-muted">02 · Image</span></div>
            <div className="relative mt-3 h-[92px] overflow-hidden rounded-xl bg-[#e3eee4]"><div aria-hidden="true" className="absolute -bottom-8 -left-3 size-28 rounded-full bg-[#8ebda0]" /><div aria-hidden="true" className="absolute right-5 top-4 size-10 rounded-full bg-[#fff5d9]" /><div aria-hidden="true" className="absolute bottom-0 right-0 h-16 w-20 rounded-tl-[60px] bg-[#3d795e]" /></div>
            <p className="mb-0 mt-3 text-[10px] text-teal">Direction selected</p>
          </div>
          <div className="rounded-[16px] border border-line bg-white p-4">
            <div className="flex items-center justify-between"><Video aria-hidden="true" className="size-4 text-[#7452a3]" /><span className="text-[9px] font-semibold uppercase tracking-[0.13em] text-muted">03 · Video</span></div>
            <div className="mt-4 grid grid-cols-3 gap-1.5">{["bg-[#d9d0e6]", "bg-[#e8ded2]", "bg-[#cfe1d7]"].map((color, index) => <div key={color} className={cn("relative aspect-video rounded-md", color)}>{index === 1 && <Play aria-hidden="true" className="absolute inset-0 m-auto size-3 fill-ink text-ink" />}</div>)}</div>
            <div className="mt-4 flex h-2 gap-1"><span className="w-2/5 rounded-full bg-[#b8a4d4]" /><span className="w-1/4 rounded-full bg-[#d2c3e5]" /><span className="w-[35%] rounded-full bg-mint" /></div>
            <p className="mb-0 mt-3 text-[10px] text-teal">Sequence assembled</p>
          </div>
          <div className="rounded-[16px] border border-line bg-white p-4">
            <div className="flex items-center justify-between"><PanelsTopLeft aria-hidden="true" className="size-4 text-[#426a9c]" /><span className="text-[9px] font-semibold uppercase tracking-[0.13em] text-muted">04 · Websites</span></div>
            <div className="mt-3 rounded-lg border border-line p-3"><div className="flex justify-between"><span className="h-1.5 w-6 bg-ink" /><span className="h-1.5 w-10 bg-line" /></div><p className="mb-0 mt-4 font-display text-xs font-semibold leading-4 tracking-[-0.04em] text-ink">A story worth<br />visiting.</p><div className="mt-3 h-3.5 w-10 rounded-full bg-teal" /></div>
            <p className="mb-0 mt-3 text-[10px] text-teal">Ready for review</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-[14px] bg-ink px-4 py-3 text-white">
          <span className="text-[10px] font-medium">Shared credits · assets · projects</span>
          <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.12em] text-mint">One workspace <ArrowRight aria-hidden="true" className="size-3" /></span>
        </div>
      </div>
      <figcaption className="sr-only">A conceptual Orindle workflow connecting a chat brief, selected image, video sequence and website in one shared project.</figcaption>
    </figure>
  );
}
