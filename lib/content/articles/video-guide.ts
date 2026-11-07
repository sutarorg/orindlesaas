import { callout, example, h3, link, p, publicationDate, table, ul, workflow, type Article } from "./types";

export const videoGuideArticle: Article = {
  slug: "create-ai-videos",
  title: "How to Create AI Videos from Text and Images",
  seoTitle: "How to Create AI Videos with Text to Video Tools",
  description: "Learn how to create AI videos using text prompts and AI video generators. Explore video concepts, prompt writing, and practical ways to create AI powered content.",
  seoKeywords: [
    "how to create AI videos",
    "AI video creation guide",
    "AI video generator tutorial",
    "text to video AI",
    "generate videos with AI",
    "AI video prompts",
    "AI video creation tools",
    "generative video",
    "AI video maker",
    "video creation with artificial intelligence",
  ],
  excerpt: "A shot-by-shot guide to AI video: choose the right starting point, direct motion, maintain continuity and turn generated clips into a reviewed sequence.",
  category: "Video",
  publishedAt: publicationDate,
  updatedAt: publicationDate,
  relatedSlugs: ["ai-image-generation-guide", "ai-for-small-business", "best-ai-tools-for-creators"],
  productLink: { href: "/features/ai-video-generator", label: "Explore Orindle Video Studio", cta: "Turn your next idea into a considered sequence" },
  sections: [
    {
      id: "start-with-sequence",
      title: "Start with a sequence, not one enormous prompt",
      blocks: [
        p("To create an AI video from text or images, define the message, break it into a few purposeful shots, generate each shot with clear subject and motion instructions, then edit and review the sequence. A single prompt asking for an entire polished advertisement makes it difficult to control pacing, continuity and the role of each scene."),
        p("Think of generation as shot exploration rather than finished-video delivery. A three-shot concept gives you separate decisions for the opening context, the important detail and the closing action. You can replace one weak shot without losing every usable part of the sequence."),
        callout("The practical quality bar", "A good AI video is not just a collection of attractive frames. Watch at full playback speed for motion artifacts, subject drift, confusing edits, inaccurate details and captions that are hard to read."),
      ],
    },
    {
      id: "starting-points",
      title: "Choose text, image or reference-based generation",
      blocks: [
        p("Text-to-video is useful for open-ended concept exploration. You describe the scene and movement without requiring an existing visual. Image-to-video is useful when an approved product, character, composition or style should anchor the result. Reference-based workflows can provide additional visual guidance, while first-and-last-frame controls can describe a transition where the exact model supports them."),
        table("Choose the starting point that serves the shot", ["Starting point", "Best for", "What to prepare", "Main limitation to review"], [
          ["Text-to-video", "Early concepts and scenes without an approved frame", "Subject, action, environment, camera and style", "Appearance and composition may vary between attempts"],
          ["Image-to-video", "Animating an approved product, character or composition", "A clean image plus explicit motion instructions", "The model may alter important details while adding motion"],
          ["Multiple references", "Identity or style guidance across a scene", "Consistent, permitted reference assets and their roles", "Support and reference behavior are model-specific"],
          ["First and last frame", "A controlled transition between two visual states", "Compatible endpoint images and a plausible action", "The middle motion still needs review"],
        ]),
        p("Google Cloud documents separate ", link("text-to-video", "https://cloud.google.com/vertex-ai/generative-ai/docs/video/generate-videos-from-text", true), ", ", link("image-to-video", "https://cloud.google.com/vertex-ai/generative-ai/docs/video/generate-videos-from-an-image", true), " and ", link("first/last-frame", "https://docs.cloud.google.com/vertex-ai/generative-ai/docs/video/generate-videos-from-first-and-last-frames", true), " workflows for supported models. Treat those as examples of workflow types, not a promise that every generator exposes the same controls."),
      ],
    },
    {
      id: "shot-plan",
      title: "Write a shot plan before generating",
      blocks: [
        p("Define the audience, the single message and the delivery format first. A vertical product teaser and a landscape website background need different compositions, pacing and safe areas. Then give each shot one visual job and one primary action. This is easier to direct and review than a scene in which five things happen at once."),
        example("A fictional three-shot product teaser", "Goal: introduce a ceramic travel cup on a workshop landing page.\nFormat: short landscape sequence; real product details supplied separately.\n\nShot 1 — Establish: the cup on a quiet workbench, morning light, gentle camera approach.\nShot 2 — Detail: close view of the lid and material texture, a hand rotates the cup once.\nShot 3 — Resolve: the cup beside a sketchbook with clear space for a real HTML headline, camera holds still.", "Shot-planning example"),
        p("The example does not prescribe a fixed generation duration or output resolution. Choose those from the actual model and destination, and expect to assemble the strongest usable moments in an editor. If you need key frames first, develop them with the ", link("AI image prompt workflow", "/blog/ai-image-generation-guide"), " so composition and style are approved before motion begins."),
      ],
    },
    {
      id: "video-prompt",
      title: "A prompt formula that includes time",
      blocks: [
        p("An image prompt describes what is present. A video prompt also needs to describe what changes. Use Subject + Action + Environment + Camera + Light/Style + Timing or constraints. Keep the action physically plausible and prioritize the movement that communicates the shot’s purpose."),
        table("The elements of a directed video prompt", ["Element", "Useful direction"], [
          ["Subject", "What should remain recognizable throughout the shot?"],
          ["Action", "What moves, in which direction, and how quickly?"],
          ["Environment", "Where does the action happen and what else moves naturally?"],
          ["Camera", "Is it locked, panning, tracking, orbiting or moving closer?"],
          ["Light and style", "What visual world and continuity should be preserved?"],
          ["Timing and constraints", "What should happen within the shot, and what must not change?"],
        ]),
        h3("text-prompt-example", "Example text-to-video prompt"),
        example("Text starting point", "A matte ceramic travel cup on a quiet woodworking bench. The camera moves slowly closer at table height while dust motes drift through soft morning window light. Restrained editorial product film, warm neutral palette, natural material texture. One gentle continuous movement; the cup shape and lid remain unchanged. No lettering or logos.", "Text-to-video"),
        h3("image-prompt-example", "Example image-to-video prompt"),
        example("Approved image starting point", "Use the supplied image as the opening composition. A hand enters from the right and rotates the cup once by a quarter turn, then leaves the frame. Camera remains locked. Preserve the cup proportions, lid design, background and soft window light. No additional objects or text.", "Image-to-video"),
        p("The second prompt spends fewer words describing appearance because the image already carries that information. It spends more words on motion and preservation. That shift is the essence of a good image-to-video handoff."),
      ],
    },
    {
      id: "continuity",
      title: "Control continuity across shots",
      blocks: [
        p("Continuity comes from repeated decisions, not from repeating the word “consistent.” Keep subject descriptions, wardrobe or product details, setting, palette and lighting language stable. Reuse approved reference inputs where supported. Generate coverage with the edit in mind: a wide view, a useful detail and a closing composition are often easier to connect than three unrelated dramatic movements."),
        ul(
          ["Create a small visual reference sheet for the subject, environment and approved style."],
          ["Change one variable per iteration so you can identify the source of drift."],
          ["Avoid unnecessary camera and subject motion in the same shot when detail accuracy matters."],
          ["Review the first and last frames for potential edit points and unexpected cropping."],
          ["Reject clips with broken product details even if the rest of the motion looks impressive."],
        ),
        table("Motion problems and practical adjustments", ["Problem", "Adjustment to test"], [
          ["Subject changes during movement", "Simplify the action, use a clearer reference and state what must remain unchanged"],
          ["Camera motion feels uncontrolled", "Use one named movement or a locked camera; reduce simultaneous subject action"],
          ["Background flickers or morphs", "Simplify the environment and avoid crowded textures or many moving objects"],
          ["Motion is too busy", "Give the shot one primary action and remove secondary events"],
          ["Shots do not belong together", "Reuse the style sheet and references; adjust the edit before regenerating everything"],
        ]),
      ],
    },
    {
      id: "edit-finish",
      title: "Edit, caption and finish the sequence",
      blocks: [
        p("Generation creates ingredients; editing gives them rhythm and meaning. Trim weak opening and ending frames, arrange shots around the message and use simpler transitions unless a complex effect serves the story. Check whether the sequence still makes sense without sound. If narration or dialogue exists, produce accurate captions and review timing rather than trusting an automatic transcript blindly."),
        p("Add music, voice and sound effects only when you have the necessary rights and they improve comprehension or mood. Keep important audio intelligible and avoid sudden level jumps. Add titles and logos in the edit as real design elements with adequate contrast and safe margins; do not depend on generated text inside a clip."),
        workflow("A final video review", [
          { title: "Watch at normal speed", text: "Look for motion artifacts and pacing problems that a contact sheet hides." },
          { title: "Watch without sound", text: "Confirm the visual story and captions remain understandable." },
          { title: "Listen without watching", text: "Check narration, music balance and distracting generated audio." },
          { title: "Inspect the destination", text: "Test the actual crop, mobile size, controls and loading behavior." },
          { title: "Verify claims and rights", text: "Review product details, people, music, references and any required AI disclosure." },
        ]),
      ],
    },
    {
      id: "credits-iteration",
      title: "Plan credits around iteration, not one perfect attempt",
      blocks: [
        p("Video exploration often requires several attempts, and different models, durations and resolutions can have different metered costs. Do not treat a credit pack as a guaranteed number of finished videos. Budget for shot exploration, reject weak generations early and keep a record of which prompt changes improved the result."),
        p("Where the workspace provides an estimate, review it before generation and check actual usage afterward. On Orindle, credits are designed to be shared across products, so an image used as a starting frame and the resulting video belong to the same usage picture. See the ", link("one-time pricing explanation", "/pricing"), " for the public credit model."),
      ],
    },
    {
      id: "next-sequence",
      title: "Make your first sequence deliberately small",
      blocks: [
        p("For your next project, choose one message and three shots. Use text for open exploration or an approved image for stronger visual anchoring, direct one primary action per shot, and finish with an actual edit and accessibility review. A short, coherent sequence is a better learning project than a long prompt filled with simultaneous events."),
        p("Orindle Video Studio is designed to keep that shot planning, selected imagery and review workflow connected to the rest of the campaign—so motion becomes part of the idea rather than an isolated export."),
      ],
    },
  ],
};
