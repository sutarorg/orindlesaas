import { callout, example, h3, link, p, publicationDate, table, ul, workflow, type Article } from "./types";

export const websiteGuideArticle: Article = {
  slug: "build-website-with-ai",
  title: "How to Build a Professional Website with AI Without Coding",
  seoTitle: "How to Build a Professional AI Website Without Coding",
  description: "Build a professional website with AI without coding: plan the brief, generate structure, refine content, test mobile, accessibility, SEO and forms.",
  excerpt: "A complete no-code AI website workflow—from business brief and real content to responsive design, accessibility, SEO and a pre-launch checklist.",
  category: "Websites",
  publishedAt: publicationDate,
  updatedAt: publicationDate,
  relatedSlugs: ["ai-for-small-business", "ai-image-generation-guide", "best-ai-tools-for-creators"],
  productLink: { href: "/features/ai-website-builder", label: "Explore Orindle Websites", cta: "Turn your next brief into a clearer website" },
  sections: [
    {
      id: "what-ai-does",
      title: "AI can build the draft; you still own the website",
      blocks: [
        p("To build a professional website with AI without coding, start with a specific audience and action, provide real business content, generate a structured draft, then refine and test it like any other website. The builder can handle layout and implementation scaffolding. It cannot know which claims are true, which contact details work or whether the final experience fits your customers unless you review those things."),
        p("“No coding” does not mean “no decisions.” Positioning, content hierarchy, visual consistency, accessibility, privacy and quality assurance still determine whether the site feels credible. Treat the first generation as a prototype, not a publishing deadline."),
        callout("A professional result", "A professional website helps a visitor understand what you offer, trust the information and complete a clear next step on any device. Visual polish matters, but working forms, honest content and readable mobile layouts matter just as much."),
      ],
    },
    {
      id: "brief",
      title: "Prepare a one-page website brief",
      blocks: [
        p("Before opening a builder, write down the site’s primary audience, purpose and action. “A website for my business” leaves too many decisions to chance. “Help local beginners understand our weekend pottery workshops and choose a suitable session” gives the AI a useful content and navigation constraint."),
        ul(
          ["Audience: who should feel that the page was made for them?"],
          ["Offer: what exactly do you provide, for whom and under what conditions?"],
          ["Action: what is the most useful next step—book, buy, register, call or read?"],
          ["Proof: what real details demonstrate quality without inventing testimonials or statistics?"],
          ["Brand: which colors, typography, imagery and tone are already established?"],
          ["Constraints: required pages, locations, policies, integrations and accessibility needs."],
        ),
        example("A fictional studio brief", "Business: Hearth & Note, a fictional neighborhood pottery studio.\nAudience: adults trying pottery for the first time.\nGoal: help visitors understand workshop format and choose a session.\nPages: Home, Workshops, Studio, FAQ and Contact.\nVoice: warm, precise, never breathless.\nDesign: natural material photography, off-white space, charcoal type and muted green accents.\nReal content required: schedule, location, accessibility details, price and registration process.\nDo not include: made-up reviews, learner counts or availability.", "Website brief template"),
      ],
    },
    {
      id: "structure-content",
      title: "Plan pages and supply real content",
      blocks: [
        p("A small site with a clear structure is better than a large site filled with generated claims. Give each page one job. A homepage introduces the offer and routes visitors; a service or workshop page answers detailed questions; an about page explains the real people or practice; a contact page provides a verified action."),
        table("A useful small-business site structure", ["Page", "Primary question", "Essential real content"], [
          ["Home", "Is this for me, and what can I do next?", "Specific offer, audience, key details and primary action"],
          ["Services / Workshops", "What exactly do I get and how does it work?", "Format, price, schedule, inclusions, limitations and FAQs"],
          ["About / Studio", "Who is behind this and why should I trust the information?", "Real story, approach, location and relevant experience"],
          ["Contact / Register", "How do I take the next step?", "Working form or booking route, response expectations and privacy context"],
          ["Policies", "How are my data, purchase and rights handled?", "Accurate business details and reviewed policy terms"],
        ]),
        p("Draft with AI where it helps, but replace generic claims with facts you can verify. Do not let the builder invent customer quotes, star ratings, partner logos, years of experience, project counts or awards. If a detail is unknown, leave it out or resolve it before publishing."),
      ],
    },
    {
      id: "generation-prompt",
      title: "Prompt for structure before visual decoration",
      blocks: [
        p("A strong generation prompt includes the brief, page inventory, content priorities and design constraints. Ask for a first version with clear sections and real content slots. If you begin with “make it stunning,” you may receive a decorative layout that obscures the offer."),
        example("AI website generation prompt", "Create a responsive five-page website for the fictional Hearth & Note pottery studio using the supplied brief. Prioritize beginner-friendly workshop information and a clear registration path. On the homepage, use a specific hero, a three-step workshop explanation, real schedule/details slots, a studio approach section, FAQs and a final registration link. Use warm off-white surfaces, charcoal text, muted green accents, generous spacing and restrained editorial typography. Do not generate reviews, ratings, customer counts or placeholder claims. Mark missing business details for manual completion. Ensure semantic headings, keyboard-accessible navigation and readable mobile layouts.", "Structure-first prompt"),
        p("Once the structure works, refine one section at a time. “Shorten the hero to one clear promise and one action” is easier to evaluate than “make the whole site better.” Keep a version you can return to before a broad visual change."),
      ],
    },
    {
      id: "design-refinement",
      title: "Make the design feel like your business",
      blocks: [
        p("A distinctive site does not require constant animation or a different card layout for every topic. Consistency in type, spacing, imagery and voice usually creates more confidence. Replace default imagery with real photos where authenticity matters, or direct original visuals with a coherent palette and composition. Keep all important labels and text as real HTML."),
        h3("design-copy", "Edit the copy out loud"),
        p("Read the homepage as if you know nothing about the business. Does the first heading say what it is and who it serves? Are prices, locations and conditions easy to find? Remove inflated adjectives and unsupported claims. Use descriptive button labels such as “View beginner workshops” rather than repeated “Learn more” links."),
        h3("design-mobile", "Design the mobile experience deliberately"),
        p("Check the site at narrow mobile width, not only by resizing a desktop preview once. Ensure navigation remains usable, text does not overflow, pricing and forms are readable, buttons are touch-friendly and images crop without hiding the subject. Avoid horizontal page scrolling and oversized fixed elements that cover the content."),
      ],
    },
    {
      id: "accessibility-seo",
      title: "Build accessibility and search fundamentals into review",
      blocks: [
        p("Accessibility and SEO overlap with good communication. Use one descriptive H1, logical H2/H3 sections, semantic links and buttons, visible keyboard focus, labelled form fields and useful alternative text for informative images. The ", link("W3C Web Content Accessibility Guidelines", "https://www.w3.org/TR/WCAG22/", true), " and ", link("W3C images tutorial", "https://www.w3.org/WAI/tutorials/images/", true), " provide detailed guidance."),
        p("For search, give each indexable page a unique useful title and meta description, a sensible URL and internal links with descriptive text. Make important content available as crawlable HTML. Google’s ", link("SEO Starter Guide", "https://developers.google.com/search/docs/fundamentals/seo-starter-guide", true), " emphasizes people-first content and logical site organization; it does not promise that following a checklist will produce a particular ranking."),
        table("Review by visitor need", ["Visitor need", "What to test"], [
          ["Keyboard and assistive technology", "Tab order, menu operation, focus, names, headings and form errors"],
          ["Mobile and zoom", "Narrow widths, 200% zoom, readable measure and no obscured controls"],
          ["Search understanding", "Unique metadata, descriptive headings, canonical URLs and useful internal links"],
          ["Performance", "Optimized images/fonts, stable dimensions and minimal third-party scripts"],
          ["Trust and action", "Verified details, honest policies, working forms and clear error/success states"],
        ]),
      ],
    },
    {
      id: "integrations",
      title: "Test the parts that make it a real website",
      blocks: [
        p("A generated contact form is not finished until a real submission reaches the intended destination and the sender receives an accurate confirmation. The same applies to booking, payments, maps, email signup and deployment. Never leave a button that only appears to work, and never show a success message before the server has accepted the action."),
        p("Connect your domain and review HTTPS, spam protection, error handling and form notifications. Check what personal information each integration collects and update policy content to match the actual services. If the site uses AI-generated code, review dependencies and configuration for exposed secrets or unsafe behavior before deployment."),
      ],
    },
    {
      id: "launch-checklist",
      title: "Run this pre-launch checklist",
      blocks: [
        workflow("A professional no-code launch review", [
          { title: "Content", text: "Verify every claim, date, price, address, bio, image right and call to action; remove all filler." },
          { title: "Interaction", text: "Test menus, links, forms, booking and error states with mouse, keyboard and touch." },
          { title: "Responsive and accessible", text: "Inspect narrow mobile and zoom, headings, focus, labels, contrast and alt text." },
          { title: "Search and sharing", text: "Check titles, descriptions, canonical URLs, social previews, sitemap and indexing rules." },
          { title: "Performance and security", text: "Optimize media, remove unused scripts, protect secrets and test the production deployment." },
          { title: "After launch", text: "Submit a real form, review logs and analytics with appropriate consent, and schedule content updates." },
        ]),
        p("Publishing is the beginning of maintenance, not the end of the build. Keep workshop dates, prices, policies and model-generated content under review. A smaller site you can maintain is more professional than a large generated site that quickly becomes inaccurate."),
      ],
    },
    {
      id: "conclusion",
      title: "Use AI for the draft, not as an excuse to skip the craft",
      blocks: [
        p("The most effective no-code AI workflow is brief → structure → real content → focused refinement → responsive and accessible testing → verified deployment. You do not need to write the code yourself to take responsibility for those steps."),
        p("Orindle Websites is designed to connect the site brief with the copy and visual assets developed elsewhere in your workspace. That continuity gives you a stronger starting point while leaving the final content, quality and publishing decisions with you."),
      ],
    },
  ],
};
