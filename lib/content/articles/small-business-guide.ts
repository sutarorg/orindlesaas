import { callout, example, link, p, publicationDate, table, ul, workflow, type Article } from "./types";

export const smallBusinessArticle: Article = {
  slug: "ai-for-small-business",
  title: "How Small Businesses Can Use AI to Create Content, Videos and Websites",
  seoTitle: "AI for Small Business: Content, Video & Website Playbook",
  description: "Use AI for small-business marketing with one connected campaign: content, images, videos and a website, plus review, budget and measurement checklists.",
  excerpt: "A realistic small-business AI playbook built around one campaign, one source brief and a clear review process—not a pressure to publish endless generated content.",
  category: "Small business",
  publishedAt: publicationDate,
  updatedAt: publicationDate,
  relatedSlugs: ["best-ai-tools-for-creators", "create-ai-videos", "build-website-with-ai"],
  productLink: { href: "/features", label: "Explore Orindle for connected business projects", cta: "Build your next campaign with one clear brief" },
  sections: [
    {
      id: "start-with-goal",
      title: "Start with a business goal, not a content quota",
      blocks: [
        p("Small businesses can use AI to turn real expertise and source material into campaign briefs, useful articles, social content, visual directions, short videos and websites. The value comes from reducing repetitive production work while preserving accurate details and human judgment—not from publishing the largest possible volume of generic content."),
        p("Choose one business action before choosing a tool. Do you want more suitable workshop registrations, qualified service inquiries, product demonstration views or returning customers? The goal determines the offer, content, call to action and measurement. “Post more on social media” is an activity, not a useful destination."),
        callout("A manageable starting point", "Run one small campaign from first brief to reviewed website before building a complex automation system. You will learn where AI helps, which inputs matter and which review steps cannot be delegated."),
      ],
    },
    {
      id: "source-brief",
      title: "Create one source-of-truth brief",
      blocks: [
        p("Gather the facts that every output should share: the offer, audience, location, dates, price, availability rules, differentiators, approved product details, brand voice and required disclosures. Include real customer questions and approved source material. Explicitly mark anything unknown so the model does not fill the gap with a plausible claim."),
        example("Fictional workshop campaign brief", "Business: Hearth & Note, a fictional pottery studio.\nOffer: a two-hour beginner workshop on 12 December, with the exact venue and price supplied by the owner.\nAudience: local adults who want a relaxed first experience.\nCustomer question: ‘Do I need any experience or equipment?’\nApproved fact: all materials are included; accessibility details must be confirmed before publication.\nDesired action: view available sessions and complete the real registration flow.\nDo not invent: reviews, attendance numbers, discounts or guaranteed outcomes.", "Campaign source brief"),
        p("This brief becomes the shared input for writing, images, video and the website. When a fact changes, update the source and identify every affected asset. A connected project makes that process easier to manage than searching through unrelated chats and downloads."),
      ],
    },
    {
      id: "content",
      title: "Use Chat for thinking and useful first drafts",
      blocks: [
        p("Conversational AI is useful for organizing source material, comparing angles and producing first drafts. Ask for specific outputs grounded only in the supplied brief: a landing-page outline, answers to common questions, a short video script or alternative subject lines. Request that missing information be flagged rather than invented."),
        example("A grounded drafting prompt", "Using only the approved campaign brief below, draft a beginner-friendly workshop page outline and three short social angles. Put the practical customer question before brand storytelling. Use warm, concise language and one clear registration action. Create a separate ‘missing information’ list for schedule, accessibility and registration details. Do not create testimonials, scarcity, attendance figures or claims that are not present in the brief.", "Small-business content prompt"),
        p("Review the output against the brief sentence by sentence. Add first-hand knowledge that a generic model cannot supply: what beginners usually worry about, what the studio actually feels like and which details make the offer distinctive. Google’s ", link("Search Essentials", "https://developers.google.com/search/docs/essentials", true), " emphasize helpful, reliable, people-first content rather than mass-produced pages."),
      ],
    },
    {
      id: "images-video",
      title: "Turn approved ideas into images and video",
      blocks: [
        p("Use real photography when the actual place, people or product provides trust. Use AI imagery for conceptual directions, illustrative scenes or campaigns where its synthetic nature is not misleading. Whichever route you choose, maintain a consistent palette, setting and subject treatment, and review rights and accuracy before publication."),
        p("For video, plan a few shots around one customer question or offer. A beginner workshop video might open with the real or conceptual workspace, show materials being prepared and close with a clear workshop detail and registration action. Use the ", link("text-and-image video guide", "/blog/create-ai-videos"), " to choose a starting point and direct motion one shot at a time."),
        table("Choose the production route that supports trust", ["Content need", "Real capture is often better when", "AI generation can help when"], [
          ["Workshop or store overview", "The real environment is the proof", "You need early layout or storyboard exploration"],
          ["Product detail", "Shape, label and usage must be exact", "You are exploring non-deceptive conceptual art direction"],
          ["Owner explanation", "Voice, experience and personality matter", "You need help structuring or editing the script"],
          ["Short social sequence", "Real process footage already exists", "You need additional illustrative shots or format variations"],
        ]),
        p("Finish every video with accurate captions, reviewed audio and channel-appropriate crops. Generation is not a reason to skip accessibility or rights checks."),
      ],
    },
    {
      id: "website",
      title: "Make the website the clear next step",
      blocks: [
        p("A campaign should lead somewhere useful. Build or update a focused page with the approved offer, practical details, relevant images and one primary action. Avoid sending every visitor to a generic homepage if a workshop or service page answers their question more directly."),
        p("Follow the ", link("professional AI website checklist", "/blog/build-website-with-ai"), ": use real content, review mobile layout, test keyboard and form behavior, add unique metadata and verify the deployed registration path. If the form does not deliver, the campaign is not ready no matter how polished the visuals look."),
        callout("Do not automate away trust", "AI can draft policies or FAQs, but a qualified owner must verify business details, consumer terms, privacy disclosures and legally required information before they go live."),
      ],
    },
    {
      id: "weekly-rhythm",
      title: "A realistic weekly operating rhythm",
      blocks: [
        p("Small teams need a process that survives a busy week. Assign an owner for facts and final approval even if AI handles parts of the draft. Batch related work around one campaign rather than opening a new blank prompt for every channel."),
        workflow("A five-day campaign workflow", [
          { title: "Day 1 — Brief and offer", text: "Verify facts, choose the customer question and define the desired business action." },
          { title: "Day 2 — Draft and select", text: "Develop page and script options; edit them with real expertise and mark missing details." },
          { title: "Day 3 — Visual production", text: "Capture or generate only the assets the approved story needs; review rights and consistency." },
          { title: "Day 4 — Website and quality checks", text: "Assemble the page, test mobile, accessibility, forms and every call to action." },
          { title: "Day 5 — Publish and learn", text: "Release the coordinated assets, record usage and inspect meaningful customer actions." },
        ]),
        p("This is an operating example, not a promise that every campaign takes five days or produces a particular result. Complex approvals, regulated claims and production constraints deserve more time."),
      ],
    },
    {
      id: "budget",
      title: "Budget for the whole workflow",
      blocks: [
        p("Track tool usage alongside production and review time. A low-cost generation that requires extensive correction may be less efficient than a simpler real photo or template. Video and image exploration can need multiple attempts, so avoid assuming that one credit pack produces a fixed amount of finished campaign work."),
        p("Orindle’s ", link("one-time credit packs", "/pricing"), " share one wallet across Chat, Image Studio, Video Studio and Websites, with operation-specific deductions. For any platform, record credits by campaign and compare them with useful outputs and business actions, not just the number of files generated."),
        ul(
          ["Set a small test budget and stop condition before broad exploration."],
          ["Approve the brief before generating multiple visual directions."],
          ["Save approved prompts and assets to avoid paying to rediscover a working recipe."],
          ["Include editing, captions, review and deployment in the production estimate."],
        ),
      ],
    },
    {
      id: "responsible",
      title: "Protect customers and the business",
      blocks: [
        p("Do not paste confidential customer records, unreleased sensitive information or material you lack permission to use into a third-party model without an approved data path. Check retention and provider terms. Establish who can publish and which claims require specialist review."),
        p("The ", link("NIST AI Resource Center", "https://airc.nist.gov/", true), " offers risk-management resources that can be adapted to small teams. For marketing, the U.S. FTC’s ", link("guidance on AI claims", "https://www.ftc.gov/business-guidance/blog/2023/02/keep-your-ai-claims-check", true), " is a reminder that claims need a reasonable basis; local requirements vary, so obtain appropriate advice for your market."),
        ul(
          ["Verify prices, dates, availability, comparisons and performance claims before publication."],
          ["Do not fabricate reviews, customer stories, before-and-after results or scarcity."],
          ["Review rights for source images, generated media, voices, music and likenesses."],
          ["Use accurate disclosures where required and never hide meaningful conditions."],
        ),
      ],
    },
    {
      id: "measurement",
      title: "Measure useful actions, not content volume",
      blocks: [
        p("Choose a small measurement plan before launch. For a workshop, useful signals may include qualified visits to the session page, completed registrations and questions that reveal missing information. For a service business, it may be suitable inquiries rather than raw form volume. Analytics and consent requirements should match the tools and markets involved."),
        p("Compare the campaign with your own previous workflow: production time, correction effort, credit usage and the quality of customer actions. Avoid inventing an industry uplift or assuming correlation proves that AI caused a result. Use what you learn to improve the next brief and remove content that did not help."),
      ],
    },
    {
      id: "first-campaign",
      title: "Build one campaign you can stand behind",
      blocks: [
        p("Start with one real offer and one source-of-truth brief. Use Chat to clarify, Image Studio and Video Studio only where visuals add value, and a focused website to make the next step clear. Keep a named human reviewer, a visible budget and a measurement plan tied to the business goal."),
        p("That is the practical promise of an all-in-one platform: not more content for its own sake, but fewer disconnected handoffs between a good idea and a useful, reviewed customer experience."),
      ],
    },
  ],
};
