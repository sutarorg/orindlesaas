import * as React from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

function Accordion({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...props} />;
}

function AccordionItem({ className, ...props }: React.DetailsHTMLAttributes<HTMLDetailsElement>) {
  return <details className={cn("group border-b border-line", className)} {...props} />;
}

function AccordionTrigger({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <summary
      className={cn(
        "group flex min-h-16 w-full cursor-pointer list-none items-center justify-between gap-6 py-5 text-left font-display text-[15px] font-semibold tracking-[-0.02em] text-ink outline-none transition-colors hover:text-teal focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-4 sm:text-base [&::-webkit-details-marker]:hidden",
        className,
      )}
      {...props}
    >
      <span>{children}</span>
      <Plus aria-hidden="true" className="size-4 shrink-0 text-teal transition-transform duration-200 group-open:rotate-45" />
    </summary>
  );
}

function AccordionContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="overflow-hidden text-sm" {...props}>
      <div className={cn("max-w-2xl pb-6 pr-8 leading-7 text-body", className)}>{children}</div>
    </div>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
