import { ArrowRight, Leaf, MapPin } from "lucide-react";
import Image from "next/image";
import type { WebsiteProject } from "@/lib/contracts/dashboard";
import { cn } from "@/lib/utils";

export type PreviewViewport = "desktop" | "tablet" | "mobile";

const sectionCopy: Record<string, string> = {
  "Our story": "A considered retreat shaped around quiet mornings, natural materials and a closer connection to the landscape.",
  Amenities: "Private cabins, nourishing food and thoughtful spaces for rest—designed to make a slower stay feel effortless.",
  Booking: "Choose your dates and begin planning a quieter kind of getaway.",
  Collection: "Explore small-batch vessels with subtle variation, honest materials and an easy place in everyday rituals.",
  Process: "From the first clay form to the final firing, each piece carries the evidence of its making.",
  Stockists: "Meet the collection in person through a small network of independent design stores.",
};

export function WebsitePreview({
  website,
  headline,
  description,
  selectedPage,
  selectedSection,
  viewport,
}: {
  website: WebsiteProject;
  headline: string;
  description: string;
  selectedPage: string;
  selectedSection: string;
  viewport: PreviewViewport;
}) {
  const isHome = selectedPage === "Home";
  const visibleSections = website.sections.filter((section) => section !== "Hero");
  return (
    <div className="flex h-full justify-center bg-[#e9eeeb] p-2 sm:p-4">
      <div
        className="website-preview h-fit min-h-full w-full overflow-hidden rounded-xl bg-[#f8f6f0] shadow-[0_8px_30px_rgba(21,25,24,0.09)] transition-[max-width] duration-300"
        style={{ maxWidth: viewport === "mobile" ? 390 : viewport === "tablet" ? 768 : 1180 }}
        data-viewport={viewport}
        aria-label={`${viewport} local website preview`}
      >
        <header className="website-preview-header flex items-center justify-between gap-4 border-b border-[#dfe3dc] px-5 py-4 sm:px-7">
          <span className="flex items-center gap-2 font-display text-xs font-semibold tracking-[-0.02em] text-[#253c32]"><Leaf className="size-4 text-[#557563]" aria-hidden="true" />{website.name}</span>
          <nav aria-label="Preview website navigation" className="website-preview-nav flex items-center gap-4 text-[10px] font-medium text-[#58675f]">{website.pages.slice(0, 3).map((page) => <span key={page} className={cn(page === selectedPage && "font-semibold text-[#253c32]")}>{page}</span>)}</nav>
        </header>
        {isHome ? (
          <>
            <section className={cn("website-preview-hero grid items-center gap-6 px-5 py-7 sm:px-7", selectedSection === "Hero" && "ring-2 ring-inset ring-teal/50")}>
              <div className="website-preview-copy">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#526458]">A place to pause</p>
                <h2 className="website-preview-title max-w-lg font-display text-[clamp(1.75rem,5vw,3.4rem)] font-medium leading-[1.04] tracking-[-0.055em] text-[#253c32]">{headline || "Untitled website concept"}</h2>
                <p className="mt-4 max-w-md text-[11px] leading-5 text-[#58675f]">{description || "Add a description in the local editor."}</p>
                <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#314d3e] px-4 py-2.5 text-[10px] font-semibold text-white">Discover the experience<ArrowRight className="size-3" aria-hidden="true" /></span>
              </div>
              <div className="website-preview-media relative aspect-[4/3] overflow-hidden rounded-lg"><Image src={website.previewImage} alt={website.previewImageAlt} fill sizes="(max-width: 768px) 100vw, 550px" className="object-cover" /><span className="absolute bottom-2 left-2 rounded-full bg-white/85 px-2 py-1 text-[8px] font-semibold text-[#425a4c]">AI-generated image fixture</span></div>
            </section>
            {visibleSections.map((section, index) => (
              <section key={section} className={cn("border-t border-[#dfe3dc] px-5 py-8 sm:px-7", selectedSection === section && "bg-[#eef4ed] ring-2 ring-inset ring-teal/40")}>
                <p className="mb-2 text-[8px] font-semibold uppercase tracking-[0.18em] text-[#526458]">0{index + 1} · {section}</p>
                <h3 className="font-display text-xl font-medium tracking-[-0.035em] text-[#253c32]">{section === "Booking" ? "Make room for stillness." : section === "Collection" ? "Made to be lived with." : section}</h3>
                <p className="mt-3 max-w-xl text-[10px] leading-5 text-[#58675f]">{sectionCopy[section] ?? `A structured ${section.toLowerCase()} section in this local website fixture.`}</p>
                {section === "Booking" && <span className="mt-4 inline-flex items-center gap-2 text-[10px] font-semibold text-[#425a4c]"><MapPin className="size-3" aria-hidden="true" />Plan your stay<ArrowRight className="size-3" aria-hidden="true" /></span>}
              </section>
            ))}
          </>
        ) : (
          <section className="grid min-h-[420px] place-items-center px-6 py-14 text-center"><div><p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#526458]">{website.name}</p><h2 className="font-display text-3xl font-medium tracking-[-0.045em] text-[#253c32]">{selectedPage}</h2><p className="mx-auto mt-4 max-w-sm text-[11px] leading-5 text-[#58675f]">This is a local {selectedPage.toLowerCase()} page presentation. Its content is illustrative and no linked page has been published.</p></div></section>
        )}
        <footer className="border-t border-[#dfe3dc] px-5 py-5 text-[10px] text-[#526458] sm:px-7">Local structured preview · not published output</footer>
      </div>
    </div>
  );
}
