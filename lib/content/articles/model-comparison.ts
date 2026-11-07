import { callout, example, link, p, publicationDate, table, ul, workflow, type Article } from "./types";

export const modelComparisonArticle: Article = {
  slug: "gpt-vs-claude-vs-gemini",
  title: "GPT vs Claude vs Gemini: Which AI Model Should You Use?",
  seoTitle: "GPT vs Claude vs Gemini AI Model Comparison Guide",
  description: "Compare GPT, Claude, and Gemini to understand their capabilities, strengths, differences, and use cases. Learn how to choose an AI model for your needs.",
  seoKeywords: [
    "GPT vs Claude vs Gemini",
    "GPT comparison",
    "Claude vs Gemini",
    "best AI models",
    "AI model comparison",
    "large language model comparison",
    "LLM comparison",
    "conversational AI models",
    "generative AI comparison",
    "how to choose an AI model",
  ],
  excerpt: "A durable alternative to brittle model rankings: compare GPT, Claude and Gemini on your own tasks with a fair prompt set, a useful rubric and total review cost.",
  category: "Model guides",
  publishedAt: publicationDate,
  updatedAt: publicationDate,
  relatedSlugs: ["best-ai-tools-for-creators", "ai-image-generation-guide", "ai-for-small-business"],
  productLink: { href: "/models", label: "Explore Orindle’s model-selection approach", cta: "Choose models with more confidence" },
  sections: [
    {
      id: "short-answer",
      title: "The short answer: there is no durable universal winner",
      blocks: [
        p("Use the model that performs best on your actual task, with acceptable factual reliability, latency, credit use and review effort. GPT, Claude and Gemini are families with multiple models and product experiences, not three fixed personalities. A comparison written around one exact version can become outdated as soon as a provider changes its catalog."),
        p("For a quick drafting task, a responsive lower-cost option may be sufficient. For a consequential analysis, output quality and verification may matter more than speed. For images, audio or video, the exact input and output modalities matter before the family name does. The most useful comparison is therefore an evaluation, not a verdict."),
        callout("Reviewed 5 November 2026", "This guide intentionally avoids exact version numbers and benchmark rankings. Check the linked official model catalogs for current capabilities and use the workflow below to compare the options actually available to you."),
      ],
    },
    {
      id: "family-product-model",
      title: "First, separate the family, model and product",
      blocks: [
        p("GPT refers to OpenAI’s model family; Claude to Anthropic’s; Gemini to Google’s. Within each family, providers offer different models for different capability, speed and cost tradeoffs. Consumer products can add search, memory, file handling, connectors or other tools around those models. Two people may therefore report different experiences even when discussing the same family."),
        p("Before comparing, write down the exact model identifier, product surface, enabled tools and date. Decide whether you are testing a model’s response to a fixed prompt or a complete product’s ability to research and complete a workflow. Mixing those tests produces misleading conclusions."),
        ul(
          [link("OpenAI’s official model catalog", "https://platform.openai.com/docs/models", true), " documents current GPT model identifiers and capabilities."],
          [link("Anthropic’s official model overview", "https://docs.anthropic.com/en/docs/about-claude/models/overview", true), " documents the current Claude lineup and platform availability."],
          [link("Google’s official Gemini model documentation", "https://ai.google.dev/gemini-api/docs/models", true), " is the source for current Gemini model options and supported inputs."],
        ),
      ],
    },
    {
      id: "comparison-criteria",
      title: "Compare the dimensions that affect your work",
      blocks: [
        p("A good comparison table should contain questions you can test, not permanent claims about which family is best. Start with the dimensions below and add requirements specific to your project, such as language support, structured output or regional data handling."),
        table("A task-based GPT, Claude and Gemini comparison framework", ["Dimension", "What to test", "How to judge", "Common mistake"], [
          ["Instruction following", "Constraints, format and requested omissions", "Every requirement checked separately", "Rewarding fluent text that ignored the brief"],
          ["Reasoning and analysis", "Multi-step problems with known answers", "Correct conclusion and inspectable supporting evidence", "Confusing a long answer with careful reasoning"],
          ["Writing and editing", "Your voice, source text and audience", "Useful structure with minimal generic additions", "Comparing prompts with different context"],
          ["Long-context work", "Questions requiring separate parts of the source", "Coverage and accurate references to supplied material", "Assuming a large context window guarantees recall"],
          ["Multimodal input", "Representative images, documents, audio or video", "Correct use of relevant details and stated limitations", "Testing only a polished demo asset"],
          ["Cost and responsiveness", "Typical and worst-case requests", "Total usage, latency and repair time", "Comparing token price without output quality"],
        ]),
        p("If your task relies on recent facts, test the actual grounding or search tool separately and inspect sources. A model’s training knowledge is not a substitute for current verification. If calculations matter, use a deterministic tool or independently check the result."),
      ],
    },
    {
      id: "task-guidance",
      title: "What to test for common creator tasks",
      blocks: [
        p("The same model does not need to win every category in your workspace. Route work according to evidence and keep a fallback for tasks where quality is inconsistent. Here is how to make common comparisons concrete."),
        table("Evaluation ideas by creative task", ["Task", "Representative test", "Quality bar"], [
          ["Campaign writing", "Turn the same messy notes into a one-page brief", "Audience, offer and constraints preserved; no invented claims"],
          ["Long-document synthesis", "Ask questions spanning beginning, middle and end", "All material caveats retained with traceable source locations"],
          ["Coding", "Fix a small reproducible bug in your own repository", "Tests pass, scope stays controlled and explanation matches changes"],
          ["Image-informed briefing", "Extract usable direction from a real layout or product photo", "Important visual details recognized without confident guesses"],
          ["High-volume transformation", "Convert structured notes into a fixed schema", "Valid output every time at acceptable usage cost and latency"],
        ]),
        p("For image and video generation, compare the dedicated generation models and controls rather than assuming a general chat model’s family tells you the whole story. Our ", link("image prompting guide", "/blog/ai-image-generation-guide"), " and ", link("AI video workflow", "/blog/create-ai-videos"), " focus on those task-specific decisions."),
      ],
    },
    {
      id: "fair-test",
      title: "Run a fair test in about an hour",
      blocks: [
        p("You do not need a research laboratory to make a better decision. A small, repeatable evaluation can expose meaningful differences. Use material you are authorized to share and remove confidential details before sending anything to a third-party service."),
        workflow("A practical model evaluation loop", [
          { title: "1. Define six tasks", text: "Include typical work, an edge case and a case where the correct answer is not present in the source." },
          { title: "2. Freeze the prompt", text: "Use the same context, output format and constraints for every model; record any unavoidable API differences." },
          { title: "3. Blind the review where possible", text: "Remove model names from outputs and score against a checklist before comparing preferences." },
          { title: "4. Record the whole cost", text: "Note usage, response time, retries and the corrections needed to reach your quality bar." },
          { title: "5. Repeat the failures", text: "Check whether a weakness is consistent before choosing a route or changing the prompt." },
        ]),
        example("A reusable scoring sheet", "Task ID: campaign-brief-02\nModel/version/date: [record exact configuration]\nInstruction following: /5\nFidelity to supplied facts: /5\nUsefulness of structure: /5\nRequired corrections: [notes]\nUsage and elapsed time: [record]\nPublishable after review? yes / no", "Evaluation template"),
        p("Google’s ", link("prompt design strategies", "https://ai.google.dev/gemini-api/docs/prompting-strategies", true), " and Anthropic’s ", link("prompting best practices", "https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/system-prompts", true), " both emphasize clear instructions and structured context. Apply sound prompting consistently rather than optimizing only one competitor’s prompt."),
      ],
    },
    {
      id: "cost-latency",
      title: "Do not let a price table make the decision for you",
      blocks: [
        p("Provider pricing can differ for input, output, cached content, reasoning, media and tools. The cheapest listed token rate does not automatically produce the cheapest completed task. A model that needs fewer retries or produces a cleaner first draft may reduce total effort; a smaller model may still be the rational choice for routine transformations."),
        p("Use a per-task record: total metered usage, number of attempts, time waiting and minutes spent correcting. On Orindle, the intended customer experience abstracts provider-specific pricing into shared credits while keeping operation usage visible. The browser should never be the authority for that deduction."),
        callout("Keep internal costs in perspective", "Public pricing should explain customer-facing credits clearly without claiming a universal savings percentage or exposing provider credentials and internal cost records."),
      ],
    },
    {
      id: "when-to-switch",
      title: "When to switch, route or use more than one model",
      blocks: [
        p("Switch when repeated evidence shows that another available option meets your quality bar more reliably or at a better total cost. Do not switch because a new model appears at the top of a generic leaderboard. Re-run a small regression set first, especially for structured outputs and prompts that depend on specific behavior."),
        p("Use more than one model when the tasks are genuinely different. A fast option may handle classification and rough variations while a more capable option handles difficult synthesis. Model routing should remain understandable: know why a task took a particular route and what it cost."),
        ul(
          ["Keep a small set of golden prompts and expected review criteria for each recurring workflow."],
          ["Version your prompts and record model/configuration changes alongside the result."],
          ["Have a fallback for provider errors or deprecations, but test the fallback before you need it."],
          ["Revalidate consequential outputs rather than assuming a stronger model removes the need for review."],
        ),
      ],
    },
    {
      id: "decision",
      title: "A simple decision you can defend",
      blocks: [
        p("If you need one starting point, choose an available model that handles your required input and output modalities, then test it on your typical work. Add a second option only when your evaluation shows a repeated quality, speed or cost advantage. That process is slower than copying a winner from a table, but the conclusion belongs to your workflow and can be retested when the catalog changes."),
        p("Orindle’s planned model experience is built around that principle: make model choice part of the creative task, not a separate research project. Explore the ", link("Models page", "/models"), " for the current availability labels and selection framework."),
      ],
    },
  ],
};
