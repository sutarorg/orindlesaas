import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function FaqList({ items }: { items: ReadonlyArray<{ question: string; answer: string }> }) {
  const groupName = `faq-${items[0]?.question ?? "empty"}`;

  return (
    <Accordion className="border-t border-line">
      {items.map((item) => (
        <AccordionItem key={item.question} name={groupName}>
          <AccordionTrigger>{item.question}</AccordionTrigger>
          <AccordionContent>{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
