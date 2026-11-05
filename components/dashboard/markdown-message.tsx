import type { ReactNode } from "react";
import { CopyButton } from "@/components/dashboard/copy-button";
import { parseSafeMarkdown } from "@/lib/dashboard/markdown";
import { cn } from "@/lib/utils";

function renderInline(text: string): ReactNode[] {
  return text.split(/(`[^`]*`|\*\*[^*]+\*\*)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index} className="rounded bg-subtle px-1.5 py-0.5 font-mono text-[0.88em] text-teal-dark">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index} className="font-semibold text-ink">{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}

export function MarkdownMessage({ markdown, className }: { markdown: string; className?: string }) {
  const blocks = parseSafeMarkdown(markdown);
  return (
    <div className={cn("space-y-4 text-[15px] leading-7 text-body", className)}>
      {blocks.map((block, index) => {
        if (block.type === "code") {
          return (
            <div key={index} className="overflow-hidden rounded-2xl bg-[#14211e] text-[#e9f5ef] shadow-sm">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-1.5">
                <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/60">{block.language}</span>
                <CopyButton text={block.text} className="text-white/80 hover:bg-white/10 hover:text-white" />
              </div>
              <pre className="max-w-full overflow-x-auto p-4 text-[13px] leading-6" tabIndex={0} aria-label={`${block.language} code example`}><code>{block.text}</code></pre>
            </div>
          );
        }
        if (block.type === "heading") {
          return block.level === 2
            ? <h2 key={index} className="pt-1 text-xl font-semibold tracking-[-0.025em]">{renderInline(block.text)}</h2>
            : <h3 key={index} className="pt-1 text-base font-semibold">{renderInline(block.text)}</h3>;
        }
        if (block.type === "list") {
          const List = block.ordered ? "ol" : "ul";
          return <List key={index} className={cn("space-y-2 pl-5", block.ordered ? "list-decimal" : "list-disc")}>{block.items.map((item, itemIndex) => <li key={itemIndex} className="pl-1">{renderInline(item)}</li>)}</List>;
        }
        return <p key={index}>{renderInline(block.text)}</p>;
      })}
    </div>
  );
}
