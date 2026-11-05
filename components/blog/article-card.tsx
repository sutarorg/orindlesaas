import Link from "next/link";
import { ArrowUpRight, BookOpen, BriefcaseBusiness, Clapperboard, MessagesSquare, PanelsTopLeft, WandSparkles } from "lucide-react";
import type { Article } from "@/lib/content/articles";
import { getReadingTime } from "@/lib/content/articles";
import { cn } from "@/lib/utils";

const categoryIcons = {
  "Creator workflows": MessagesSquare,
  "Model guides": BookOpen,
  Image: WandSparkles,
  Video: Clapperboard,
  Websites: PanelsTopLeft,
  "Small business": BriefcaseBusiness,
};

const categoryColors = {
  "Creator workflows": "bg-[#eaf6f1] text-teal",
  "Model guides": "bg-[#edf2f7] text-[#486482]",
  Image: "bg-[#e9f6ed] text-[#39735b]",
  Video: "bg-[#f0eafb] text-[#7452a3]",
  Websites: "bg-[#e8f0fc] text-[#426a9c]",
  "Small business": "bg-[#f5f1e8] text-[#806334]",
};

export function ArticleCard({ article, featured = false, index }: { article: Article; featured?: boolean; index?: number }) {
  const Icon = categoryIcons[article.category];
  return (
    <article className={cn("group overflow-hidden rounded-[22px] border border-line bg-white transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-teal/35", featured && "lg:grid lg:grid-cols-[0.9fr_1.1fr]")}>
      <Link href={`/blog/${article.slug}`} className="flex h-full flex-col focus-visible:outline-none">
        <div className={cn("relative flex min-h-44 flex-col justify-between overflow-hidden p-6", categoryColors[article.category], featured && "min-h-72 lg:min-h-full lg:p-9")}>
          <div aria-hidden="true" className="absolute -bottom-16 -right-12 size-48 rounded-full border-[36px] border-current opacity-[0.055]" />
          <div className="relative flex items-center justify-between"><Icon aria-hidden="true" className="size-6" /><span className="font-display text-xs font-semibold">{typeof index === "number" ? `0${index + 1}` : "Guide"}</span></div>
          <div className="relative mt-10"><span className="text-[10px] font-semibold uppercase tracking-[0.15em]">Orindle playbook</span><p className="mb-0 mt-2 max-w-xs font-display text-xl font-semibold leading-7 tracking-[-0.035em] text-ink">{article.category}</p></div>
        </div>
        <div className={cn("flex flex-1 flex-col p-6 sm:p-7", featured && "justify-center lg:p-10")}>
          <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.13em] text-muted"><span>{article.category}</span><span aria-hidden="true">·</span><span>{getReadingTime(article)} min read</span></div>
          <h2 className={cn("mb-0 mt-4 text-balance font-display text-[22px] font-semibold leading-[1.25] tracking-[-0.035em] text-ink transition-colors group-hover:text-teal", featured && "text-[clamp(1.8rem,3vw,2.55rem)] leading-[1.15]")}>{article.title}</h2>
          <p className="mb-0 mt-4 text-sm leading-6 text-body">{article.excerpt}</p>
          <span className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-teal">Read the guide <ArrowUpRight aria-hidden="true" className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span>
        </div>
      </Link>
    </article>
  );
}
