export type ModelFamily = {
  name: string;
  provider: string;
  summary: string;
  usefulFor: readonly string[];
  status: "Planned for launch";
};

export const modelFamilies: readonly ModelFamily[] = [
  {
    name: "GPT",
    provider: "OpenAI",
    summary: "A model family to evaluate for general writing, reasoning, coding and multimodal workflows.",
    usefulFor: ["General assistance", "Structured drafting", "Multimodal tasks"],
    status: "Planned for launch",
  },
  {
    name: "Claude",
    provider: "Anthropic",
    summary: "A model family to evaluate for nuanced writing, analysis and careful work with provided context.",
    usefulFor: ["Long-form drafting", "Context analysis", "Editorial refinement"],
    status: "Planned for launch",
  },
  {
    name: "Gemini",
    provider: "Google",
    summary: "A model family to evaluate for multimodal exploration and tasks connected to varied source material.",
    usefulFor: ["Multimodal exploration", "Summarization", "Creative development"],
    status: "Planned for launch",
  },
] as const;

export const modelPrinciples = [
  {
    title: "Start with the job",
    description: "Define the input, desired output and quality bar before comparing model names.",
  },
  {
    title: "Test on your material",
    description: "A small set of representative prompts reveals more useful differences than a universal ranking.",
  },
  {
    title: "Account for the whole cost",
    description: "Compare output quality, credit usage, latency and the review effort required for each option.",
  },
] as const;
