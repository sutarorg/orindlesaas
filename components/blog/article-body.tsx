import { ArrowDown, Check, Lightbulb } from "lucide-react";
import type { ArticleBlock, ArticleSection } from "@/lib/content/articles/types";
import { RichText } from "@/components/blog/rich-text";

function Block({ block }: { block: ArticleBlock }) {
  switch (block.type) {
    case "paragraph":
      return <p className="mb-0 text-[17px] leading-8 text-body">{<RichText content={block.content} />}</p>;
    case "heading":
      return <h3 id={block.id} className="pt-3 font-display text-xl font-semibold leading-7 tracking-[-0.03em] text-ink sm:text-2xl sm:leading-8">{block.title}</h3>;
    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return (
        <List className={`space-y-3 ${block.ordered ? "list-decimal" : "list-none"} ${block.ordered ? "pl-5" : ""}`}>
          {block.items.map((item, index) => (
            <li key={index} className="flex gap-3 text-[16px] leading-7 text-body">
              {!block.ordered && <Check aria-hidden="true" className="mt-1.5 size-4 shrink-0 text-teal" />}
              <span className={block.ordered ? "pl-1" : ""}><RichText content={item} /></span>
            </li>
          ))}
        </List>
      );
    }
    case "example":
      return (
        <figure className="m-0 overflow-hidden rounded-2xl border border-teal/15 bg-[#f1f8f4]">
          <figcaption className="border-b border-teal/10 px-5 py-4 sm:px-6">
            <span className="block text-[9px] font-semibold uppercase tracking-[0.15em] text-teal">{block.label}</span>
            <span className="mt-1 block font-display text-base font-semibold tracking-[-0.02em] text-ink">{block.title}</span>
          </figcaption>
          <pre className="m-0 whitespace-pre-wrap break-words px-5 py-5 font-sans text-sm leading-7 text-body sm:px-6">{block.text}</pre>
        </figure>
      );
    case "callout":
      return (
        <aside className="flex gap-4 rounded-r-xl border-l-2 border-teal bg-soft px-5 py-5 sm:px-6">
          <Lightbulb aria-hidden="true" className="mt-1 size-4 shrink-0 text-teal" />
          <div><h3 className="mb-2 font-sans text-sm font-semibold tracking-[-0.01em] text-ink">{block.title}</h3><p className="m-0 text-sm leading-7 text-body"><RichText content={block.content} /></p></div>
        </aside>
      );
    case "table":
      return (
        <div className="w-full max-w-full overflow-x-auto rounded-2xl border border-line" role="region" aria-label={block.caption} tabIndex={0}>
          <table className="w-full min-w-[680px] border-collapse text-left">
            <caption className="sr-only">{block.caption}</caption>
            <thead className="bg-soft">
              <tr>{block.headers.map((header) => <th key={header} scope="col" className="px-4 py-4 text-xs font-semibold leading-5 text-ink">{header}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-line">
              {block.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => cellIndex === 0 ? <th key={cellIndex} scope="row" className="px-4 py-4 align-top text-xs font-semibold leading-6 text-ink">{cell}</th> : <td key={cellIndex} className="px-4 py-4 align-top text-xs leading-6 text-body">{cell}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
      );
    case "workflow":
      return (
        <section className="rounded-2xl border border-line bg-soft p-5 sm:p-7" aria-labelledby={`workflow-${block.title.replace(/\W+/g, "-").toLowerCase()}`}>
          <h3 id={`workflow-${block.title.replace(/\W+/g, "-").toLowerCase()}`} className="mb-6 flex items-center gap-2 font-display text-lg font-semibold tracking-[-0.025em]"><ArrowDown aria-hidden="true" className="size-4 text-teal" />{block.title}</h3>
          <ol className="space-y-0">
            {block.steps.map((step, index) => (
              <li key={step.title} className="relative grid gap-2 pb-6 pl-10 last:pb-0 sm:grid-cols-[0.75fr_1.25fr] sm:gap-5">
                {index < block.steps.length - 1 && <span aria-hidden="true" className="absolute bottom-0 left-[13px] top-7 w-px bg-line" />}
                <span aria-hidden="true" className="absolute left-0 top-0 flex size-7 items-center justify-center rounded-full border border-teal/20 bg-white font-display text-[10px] font-semibold text-teal">{index + 1}</span>
                <h4 className="m-0 font-sans text-sm font-semibold leading-6 text-ink">{step.title}</h4>
                <p className="m-0 text-sm leading-6 text-body">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>
      );
  }
}

export function ArticleBody({ sections }: { sections: readonly ArticleSection[] }) {
  return (
    <div className="min-w-0">
      {sections.map((section) => (
        <section key={section.id} id={section.id} className="border-b border-line py-10 first:pt-0 last:border-0 sm:py-12">
          <h2 className="mb-6 text-balance font-display text-[clamp(1.65rem,3vw,2.25rem)] font-semibold leading-[1.18] tracking-[-0.04em] text-ink">{section.title}</h2>
          <div className="space-y-6">{section.blocks.map((block, index) => <Block key={index} block={block} />)}</div>
        </section>
      ))}
    </div>
  );
}
