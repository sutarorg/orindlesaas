export type CreditPack = {
  id: "creator" | "pro" | "studio";
  name: string;
  priceUsd: 19 | 49 | 99;
  credits: 1900 | 4900 | 9900;
  description: string;
  fit: string;
  featured?: boolean;
};

export const creditPacks: readonly CreditPack[] = [
  {
    id: "creator",
    name: "Creator",
    priceUsd: 19,
    credits: 1900,
    description: "A flexible starting point for exploring a connected creative workflow.",
    fit: "For focused personal projects",
  },
  {
    id: "pro",
    name: "Pro",
    priceUsd: 49,
    credits: 4900,
    description: "More room to develop campaigns across conversation, images and motion.",
    fit: "For regular multi-format work",
    featured: true,
  },
  {
    id: "studio",
    name: "Studio",
    priceUsd: 99,
    credits: 9900,
    description: "A larger shared wallet for ambitious, asset-heavy creative projects.",
    fit: "For broader creative pipelines",
  },
] as const;

export const creditFaqs = [
  {
    question: "Is this a monthly subscription?",
    answer:
      "No. Creator, Pro and Studio are one-time credit packages. There is no recurring subscription in this pricing model. You can choose another pack later when you need more credits.",
  },
  {
    question: "Can I use the same credits in every product?",
    answer:
      "Yes. The planned universal wallet is shared by Orindle Chat, Image Studio, Video Studio and Websites, so you do not need a separate balance for each product.",
  },
  {
    question: "Does every AI action cost the same number of credits?",
    answer:
      "No. Different models and operations have different metered costs. Text, images, video and website operations can use credits at different rates. The future workspace should show a server-issued estimate where feasible and record actual usage in your history.",
  },
  {
    question: "What does 100 credits represent?",
    answer:
      "One hundred credits represent $1 of customer-facing usage value. This is a usage unit, not a cash balance, and it does not mean every operation has the same price.",
  },
  {
    question: "How do I know what I have used?",
    answer:
      "The connected account experience is designed to provide one usage history across all four products, showing credits used by operation. This backend capability is outside the current public-frontend stage.",
  },
  {
    question: "Are refunds or disputes ever possible?",
    answer:
      "The Credits Policy explains purchases and usage while preserving applicable statutory consumer rights, payment disputes and legally required remedies. It does not make a blanket claim that refunds are never possible.",
  },
] as const;

export function getCreditPack(id: string) {
  return creditPacks.find((pack) => pack.id === id);
}
