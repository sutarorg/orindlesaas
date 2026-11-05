export const generalFaqs = [
  {
    question: "What is Orindle?",
    answer:
      "Orindle is a planned all-in-one AI workspace for four connected products: Chat, Image Studio, Video Studio and Websites. The experience is designed around one account, shared projects and assets, and one universal credit wallet.",
  },
  {
    question: "Is Orindle a collection of separate AI tools?",
    answer:
      "The goal is a connected workflow rather than four isolated destinations. A conversation can become a creative brief, an image can become a video starting frame, and approved content can inform a website—all within the same project structure.",
  },
  {
    question: "Which AI models will be available?",
    answer:
      "The model ecosystem is planned around families such as GPT, Claude and Gemini, with exact model IDs and availability determined by the launch configuration. The public frontend does not make live model calls, and the Models page does not present planned options as already connected.",
  },
  {
    question: "Do I need four different credit balances?",
    answer:
      "No. Orindle is designed around one universal credit wallet shared across all four products, with one usage history to help you understand where credits go.",
  },
  {
    question: "Are credit packs subscriptions?",
    answer:
      "No. Creator, Pro and Studio are one-time purchases. They do not renew monthly. Usage costs vary by model and operation, and you can purchase another pack when you need more credits.",
  },
  {
    question: "Can I use Orindle for client or business work?",
    answer:
      "The connected workflow is designed for creators and businesses. You remain responsible for reviewing outputs, checking rights and factual accuracy, and making sure the final use complies with applicable law and provider terms.",
  },
] as const;

export const accountFaqs = [
  {
    question: "Can I try the live products on this website?",
    answer:
      "This stage is the public frontend only. It does not execute AI generation, create accounts or process payments. Account and checkout destinations explain their preview status instead of simulating success.",
  },
  {
    question: "Will my projects work across products?",
    answer:
      "That is the shared-workspace design: one project system and asset library across Chat, Image Studio, Video Studio and Websites. The production behavior will be implemented and tested in the later application stages.",
  },
] as const;
