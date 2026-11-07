export type ProductId = "chat" | "image" | "video" | "websites";
export type ProductAccent = "cyan" | "mint" | "purple" | "blue";

export type Product = {
  id: ProductId;
  slug: string;
  name: string;
  shortName: string;
  route: string;
  eyebrow: string;
  tagline: string;
  description: string;
  /** Absolute meta title used for search results and social previews. */
  seoTitle: string;
  /** Meta description used for search results and social previews. */
  seoDescription: string;
  /** Search keywords for this product page. */
  seoKeywords: readonly string[];
  longDescription: string;
  accent: ProductAccent;
  benefits: ReadonlyArray<{ title: string; description: string }>;
  workflow: ReadonlyArray<{ title: string; description: string }>;
  capabilities: readonly string[];
  useCases: readonly string[];
  relatedArticle: string;
  relatedArticleLabel: string;
};

export const products: readonly Product[] = [
  {
    id: "chat",
    slug: "ai-chat",
    name: "Orindle Chat",
    shortName: "Chat",
    route: "/features/ai-chat",
    seoTitle: "AI Chat for Writing Research and Productivity",
    seoDescription: "Chat with AI using Orindle to brainstorm ideas, write content, research topics, summarize information, and improve everyday productivity with AI assistance.",
    seoKeywords: [
      "AI chat",
      "AI chatbot online",
      "chat with AI",
      "AI writing assistant",
      "AI research assistant",
      "conversational AI",
      "AI productivity assistant",
      "online AI assistant",
      "AI chat platform",
      "artificial intelligence chatbot",
    ],
    eyebrow: "Think with more clarity",
    tagline: "A conversation that keeps the work moving.",
    description:
      "Explore ideas, shape briefs and turn rough thinking into useful direction with the right AI model for the task.",
    longDescription:
      "Orindle Chat is the thinking space inside your creative workflow. Compare approaches, develop a campaign brief, refine copy and carry the result into your next image, video or website project—without rebuilding the context from scratch.",
    accent: "cyan",
    benefits: [
      {
        title: "Choose by task",
        description:
          "Use model guidance to match reasoning, writing and multimodal tasks to an appropriate option.",
      },
      {
        title: "Keep the brief close",
        description:
          "Organize conversations around projects so the useful context remains connected to the work.",
      },
      {
        title: "Turn words into action",
        description:
          "Move a refined prompt or content outline into another Orindle product without a copy-paste maze.",
      },
    ],
    workflow: [
      { title: "Start with context", description: "Share the audience, goal, constraints and source material." },
      { title: "Develop the thinking", description: "Ask for alternatives, challenge assumptions and refine the useful parts." },
      { title: "Use the output", description: "Carry a clear brief or draft into your next creative step." },
    ],
    capabilities: ["Project-based conversations", "Model-selection guidance", "Brief and copy development", "Connected creative handoffs"],
    useCases: ["Campaign concepts", "Content outlines", "Product messaging", "Research synthesis"],
    relatedArticle: "/blog/gpt-vs-claude-vs-gemini",
    relatedArticleLabel: "Read the practical model-selection guide",
  },
  {
    id: "image",
    slug: "ai-image-generator",
    name: "Orindle Image Studio",
    shortName: "Image Studio",
    route: "/features/ai-image-generator",
    seoTitle: "AI Image Generator for Creative Images and AI Art",
    seoDescription: "Create original visuals with the Orindle AI image generator. Turn text prompts into AI images, explore creative styles, and bring your visual ideas to life.",
    seoKeywords: [
      "AI image generator",
      "AI art generator",
      "text to image AI",
      "image generation AI",
      "create images with AI",
      "AI picture generator",
      "AI visual creation",
      "AI image creator",
      "generative AI art",
      "online image generator",
    ],
    eyebrow: "Make the idea visible",
    tagline: "Art direction, without the scattered tabs.",
    description:
      "Develop visual directions from prompts, explore variations and organize the images that belong to each project.",
    longDescription:
      "Image Studio gives prompts a proper creative home. Start with a subject and purpose, shape composition and style, compare directions and keep selected assets connected to the campaign or website they belong to.",
    accent: "mint",
    benefits: [
      {
        title: "Direct, don’t just describe",
        description: "Work with subject, setting, composition, light and style as separate creative decisions.",
      },
      {
        title: "Explore with intention",
        description: "Compare variations against your brief rather than collecting disconnected outputs.",
      },
      {
        title: "Build a usable library",
        description: "Keep generated assets organized for reuse across video scenes and website projects.",
      },
    ],
    workflow: [
      { title: "Frame the brief", description: "Define the communication goal before choosing a visual style." },
      { title: "Create and compare", description: "Iterate on composition and details with deliberate prompt changes." },
      { title: "Save the direction", description: "Organize selected assets for the next stage of the project." },
    ],
    capabilities: ["Prompt-led visual exploration", "Style and composition iteration", "Project asset organization", "Image-to-video handoff"],
    useCases: ["Campaign artwork", "Concept frames", "Social creatives", "Website art direction"],
    relatedArticle: "/blog/ai-image-generation-guide",
    relatedArticleLabel: "Learn a better image-prompt workflow",
  },
  {
    id: "video",
    slug: "ai-video-generator",
    name: "Orindle Video Studio",
    shortName: "Video Studio",
    route: "/features/ai-video-generator",
    seoTitle: "AI Video Generator for Text to Video Creation",
    seoDescription: "Create engaging videos with the Orindle AI video generator. Transform ideas and text prompts into AI generated video content for creative and digital projects.",
    seoKeywords: [
      "AI video generator",
      "text to video AI",
      "AI video maker",
      "generate videos with AI",
      "AI video creation",
      "video generation AI",
      "AI video creator",
      "generative video tools",
      "AI content creation",
      "online AI video generator",
    ],
    eyebrow: "Give the story motion",
    tagline: "From a single frame to a considered sequence.",
    description:
      "Plan shots, explore text-to-video and image-to-video directions, and shape short-form stories in one place.",
    longDescription:
      "Video Studio connects the idea, the key frame and the moving sequence. Develop a shot list, use text or an existing image as your starting point, review motion and continuity, then keep the results with the wider project.",
    accent: "purple",
    benefits: [
      {
        title: "Think in shots",
        description: "Break a larger idea into purposeful scenes with a clear action and visual role.",
      },
      {
        title: "Start either way",
        description: "Explore written concepts or give an existing image a carefully described movement.",
      },
      {
        title: "Review the whole sequence",
        description: "Check continuity, pacing and legibility instead of judging each clip in isolation.",
      },
    ],
    workflow: [
      { title: "Write the sequence", description: "Give each shot one subject, action and camera direction." },
      { title: "Create the motion", description: "Use a text concept or image starting frame for each planned shot." },
      { title: "Edit with judgment", description: "Review continuity and assemble only the clips that serve the story." },
    ],
    capabilities: ["Text and image starting points", "Shot-by-shot planning", "Project-based clip organization", "Connected image workflows"],
    useCases: ["Product teasers", "Concept films", "Social sequences", "Storyboard exploration"],
    relatedArticle: "/blog/create-ai-videos",
    relatedArticleLabel: "Plan a stronger text-and-image video workflow",
  },
  {
    id: "websites",
    slug: "ai-website-builder",
    name: "Orindle Websites",
    shortName: "Websites",
    route: "/features/ai-website-builder",
    seoTitle: "AI Website Builder to Create Websites Without Coding",
    seoDescription: "Build websites with AI using Orindle. Turn your ideas into website experiences with an AI powered website builder designed to simplify website creation.",
    seoKeywords: [
      "AI website builder",
      "build website with AI",
      "AI website generator",
      "create website without coding",
      "AI web design",
      "AI website creator",
      "no code website builder",
      "website creation AI",
      "AI web development tools",
      "automated website design",
    ],
    eyebrow: "Give the work a home",
    tagline: "A professional website begins with a better brief.",
    description:
      "Turn your positioning, content and visual direction into a responsive website you can review and refine.",
    longDescription:
      "Orindle Websites brings the pieces together. Shape a site brief, generate a structured starting point, refine the content and design, then prepare the result for review and deployment through the connected workspace.",
    accent: "blue",
    benefits: [
      {
        title: "Structure before styling",
        description: "Start with the audience, page goal and content hierarchy rather than a decorative template.",
      },
      {
        title: "Use your real assets",
        description: "Bring approved copy and project imagery into a coherent responsive composition.",
      },
      {
        title: "Review like a professional",
        description: "Check mobile behavior, accessibility, metadata and links before considering publication.",
      },
    ],
    workflow: [
      { title: "Brief the site", description: "Define the audience, offer, pages and action visitors should take." },
      { title: "Build and refine", description: "Develop structure, copy and visual direction as connected decisions." },
      { title: "Review and prepare", description: "Inspect responsive, accessible and search fundamentals before deployment." },
    ],
    capabilities: ["Brief-led site structure", "Responsive design iteration", "Shared copy and image assets", "Deployment workflow handoff"],
    useCases: ["Portfolio sites", "Campaign landing pages", "Business websites", "Product launches"],
    relatedArticle: "/blog/build-website-with-ai",
    relatedArticleLabel: "Follow the no-code AI website checklist",
  },
] as const;

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getProductById(id: ProductId) {
  return products.find((product) => product.id === id);
}
