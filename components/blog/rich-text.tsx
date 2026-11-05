import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { RichText as RichTextType } from "@/lib/content/articles/types";

export function RichText({ content }: { content: RichTextType }) {
  return content.map((part, index) => {
    if (typeof part === "string") return <span key={index}>{part}</span>;
    if (part.external) {
      return (
        <a key={index} href={part.href} rel="external noopener noreferrer" className="font-medium text-teal underline decoration-teal/30 underline-offset-4 transition-colors hover:decoration-teal">
          {part.text}<ExternalLink aria-hidden="true" className="mb-0.5 ml-1 inline size-3" /><span className="sr-only"> (external source)</span>
        </a>
      );
    }
    return <Link key={index} href={part.href} className="font-medium text-teal underline decoration-teal/30 underline-offset-4 transition-colors hover:decoration-teal">{part.text}</Link>;
  });
}
