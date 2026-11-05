import { callout, example, h3, link, p, publicationDate, table, ul, workflow, type Article } from "./types";

export const imageGuideArticle: Article = {
  slug: "ai-image-generation-guide",
  title: "How to Generate Stunning AI Images: Prompts, Styles and Techniques",
  seoTitle: "How to Generate Better AI Images: Prompts & Techniques",
  description: "Write stronger AI image prompts with purpose, subject, composition, light and style. Follow worked examples, iteration tactics and review checks.",
  excerpt: "Move beyond keyword-filled prompts: learn practical art direction, a six-part prompt anatomy, one-variable iteration and the review steps that make images usable.",
  category: "Image",
  publishedAt: publicationDate,
  updatedAt: publicationDate,
  relatedSlugs: ["create-ai-videos", "best-ai-tools-for-creators", "build-website-with-ai"],
  productLink: { href: "/features/ai-image-generator", label: "Explore Orindle Image Studio", cta: "Give your next image a clearer direction" },
  sections: [
    {
      id: "better-images",
      title: "Better images begin before the prompt",
      blocks: [
        p("To generate a stronger AI image, decide what the image must communicate, who it is for and where it will appear. Then write a prompt that separates the subject, setting, composition, light, style and output shape. A beautiful but irrelevant image is not a successful campaign asset, and a long prompt full of contradictory quality keywords is not art direction."),
        p("Start with the communication job. A website hero may need quiet negative space for a real HTML headline. A product detail image needs an accurate, unobstructed view. A conceptual editorial image can be more expressive. These decisions determine what to emphasize and what to leave out."),
        callout("The useful quality bar", "Judge an image against its intended use, not just its first impression. Check composition at the final crop, subject accuracy, brand fit, artifacts and whether meaningful text needs to be added as real design rather than generated into the picture."),
      ],
    },
    {
      id: "prompt-anatomy",
      title: "A six-part prompt anatomy",
      blocks: [
        p("A reliable prompt is a compact creative brief. You do not need every element in every generation, but separating the decisions makes iteration much easier. Use natural, specific language and avoid stacking synonyms that ask for conflicting outcomes."),
        table("The six parts of an intentional image prompt", ["Element", "Question to answer", "Example direction"], [
          ["Subject", "What must be recognizable?", "A matte ceramic bottle with a short wooden cap"],
          ["Setting", "Where is it, and what surrounds it?", "On pale limestone beside a single green leaf"],
          ["Composition", "Where is the viewer and what is emphasized?", "Eye-level medium close-up, bottle right of center, negative space left"],
          ["Light and color", "What creates mood and dimension?", "Soft window light from the left, warm neutral palette"],
          ["Style and medium", "What visual language should it use?", "Restrained editorial product photography, natural texture"],
          ["Output constraints", "What shape and usable space are required?", "Landscape 3:2, uncluttered background, no lettering or logo"],
        ]),
        example("From vague to directed", "Vague: A beautiful luxury skincare bottle, stunning, 8K, best quality.\n\nDirected: A matte ceramic skincare bottle with a short wooden cap on pale limestone, one small green leaf beside it. Eye-level medium close-up, bottle on the right third with generous negative space on the left. Soft window light from camera-left, warm neutral palette, restrained editorial product photography with natural material texture. Landscape composition, uncluttered background, no lettering or logo.", "Worked product prompt"),
        p("The directed version is not effective because it is longer. It is effective because each phrase resolves a different visual decision. If the model offers a specific aspect-ratio control, use that control rather than relying only on words. The ", link("OpenAI image generation guide", "https://platform.openai.com/docs/guides/image-generation", true), " illustrates that text and image inputs can also support editing workflows; exact controls vary by model."),
      ],
    },
    {
      id: "styles",
      title: "Use style as a system, not a bag of keywords",
      blocks: [
        p("Style is the relationship between medium, light, palette, texture and composition. Naming a coherent visual format usually helps more than adding generic superlatives. “Editorial still-life photography” gives the model a different framework from “flat geometric screen-print illustration,” even if the subject stays the same."),
        h3("photographic-direction", "For photographic directions"),
        p("Describe the kind of photograph, viewpoint, light and surface detail. Camera or lens language can help when it supports a real visual intention, such as a wide establishing view or shallow close-up, but accumulating equipment names is not a substitute for composition. Include a few natural imperfections if flawless synthetic surfaces are making the result feel artificial."),
        h3("illustration-direction", "For illustration and graphic directions"),
        p("Name the medium and construction: flat vector shapes, rough gouache texture, ink crosshatching, paper-cut layers or geometric screen print. Specify how detail should be distributed and how many colors dominate. If the image will sit beside typography, ask for simple shapes and usable empty areas rather than intricate detail behind the text."),
        h3("style-consistency", "For a consistent series"),
        p("Create a short style sheet before generating the set: fixed palette, lighting, medium, viewpoint range and recurring materials. Keep those phrases stable while changing the subject. Where supported, use an approved reference image or editing workflow. Do not rely on a character seed or reference control unless the exact model documents it."),
      ],
    },
    {
      id: "iteration",
      title: "Iterate one decision at a time",
      blocks: [
        p("If you change the subject, lighting, style and aspect ratio all at once, you cannot tell which change improved the result. Keep a small prompt history and alter one meaningful variable per round. Early exploration can be broad; once a direction works, become more controlled."),
        workflow("A deliberate image iteration loop", [
          { title: "Explore composition", text: "Generate a few framing directions while keeping subject and style stable." },
          { title: "Select a direction", text: "Choose against the brief and intended crop, not just the most dramatic image." },
          { title: "Refine one variable", text: "Adjust light, setting or style separately and compare with the previous selection." },
          { title: "Inspect the usable details", text: "Check hands, product features, edges, reflections, text and background artifacts at full size." },
          { title: "Save the recipe", text: "Record the prompt, reference inputs, model/settings and why the final image was approved." },
        ]),
        table("Troubleshooting without rewriting everything", ["Problem", "Try changing", "Avoid"], [
          ["Subject gets lost", "Simplify the setting and state the visual priority first", "Adding more background objects and style keywords"],
          ["No space for a headline", "Specify subject placement and negative space; generate the correct crop", "Shrinking an already dense image to fit"],
          ["Results feel plastic", "Describe natural texture, restrained light and small imperfections", "Adding more ‘hyperreal’ and ‘8K’ modifiers"],
          ["Series looks inconsistent", "Lock the style sheet and reuse approved references where supported", "Changing medium, palette and lens language per image"],
          ["Unwanted lettering", "Ask for no lettering and add real typography in the design tool", "Depending on generated text for a critical label"],
        ]),
      ],
    },
    {
      id: "references-editing",
      title: "Use references and edits with a clear purpose",
      blocks: [
        p("A reference image can anchor composition, material, palette or subject appearance, depending on what the selected model supports. Choose clean inputs you have permission to use and explain which property should carry over. If everything in the reference matters except the background, say so; if only the palette matters, do not assume the model will infer that."),
        p("For editing, isolate the change. Ask for the background to become quieter while preserving the product shape, or extend the canvas to create room for a layout. Review the unchanged areas as carefully as the edit: a local request can still produce an unexpected global difference."),
        callout("Model-specific controls", "Reference types, masks, seeds, first-frame controls and negative-prompt behavior are not universal. Read the exact model’s documentation instead of copying parameters from another generator."),
      ],
    },
    {
      id: "usable-assets",
      title: "Turn generations into usable assets",
      blocks: [
        p("A selected image still needs production review. Crop it into the real placement, test it beside actual text and inspect the smallest intended display size. An image with delicate detail may work on a desktop artboard but become unreadable as a mobile thumbnail."),
        ul(
          ["Check factual and product details, especially shape, labels, quantities and how an object is being used."],
          ["Inspect anatomy, object boundaries, reflections, shadows and repeated patterns at full resolution."],
          ["Add headings, prices, logos and interface labels as real HTML or design-layer typography, not garbled image text."],
          ["Write useful alt text for informative web images and mark decorative images appropriately."],
          ["Keep the prompt and source/reference record with the approved asset for future revisions."],
        ),
        p("If the image will become a video starting frame, leave visual room for the intended motion and avoid a composition with important details already clipped. Continue with our ", link("guide to creating AI videos from text and images", "/blog/create-ai-videos"), " to plan that handoff."),
      ],
    },
    {
      id: "rights-responsibility",
      title: "Style, rights and responsible use",
      blocks: [
        p("Do not assume a generated image is automatically exclusive or cleared for every commercial use. Review the provider’s current terms and the rights in your inputs. Be cautious with recognizable people, protected characters, brand elements and imitation of a living artist’s distinctive style. When in doubt, describe broader visual properties rather than requesting an exact copy."),
        p("For editorial or informational uses, consider whether a synthetic image could mislead viewers about a real event, person or product capability. Add disclosure where required and choose real photography when authenticity is the point. Good creative direction includes knowing when AI is not the right source."),
      ],
    },
    {
      id: "next-image",
      title: "A practical brief for your next image",
      blocks: [
        p("Before your next generation, write one sentence for the communication goal, one for the intended placement and a six-part prompt. Explore composition first, then refine one decision at a time. Save the approved prompt with the asset and perform a final crop, detail and rights review."),
        p("Orindle Image Studio is designed to keep those directions and selected assets connected to the wider project, so a strong image can become an input to the next video or website rather than another lost download."),
      ],
    },
  ],
};
