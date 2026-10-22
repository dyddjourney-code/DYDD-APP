import { mobileComparisonTables } from "@/lib/courses/mobile-comparison-tables";
/** Source-authored teaching shared by the player and standalone routes. */
export function DesignIdAuthoredBody({ bodyHtml, images, compactIntro = false, capacityIntro = false }: { bodyHtml: string; images: readonly { src: string; alt: string }[]; compactIntro?: boolean; capacityIntro?: boolean }) {
  return <section className={`lesson-source readable-lesson-body designid-clean-lesson designid-authored-body${compactIntro ? " designid-compact-intro" : ""}${capacityIntro ? " designid-capacity-intro" : ""}`} aria-label="Lesson body">
    {images.map(image => <figure className="designid-authored-artwork" key={image.src}><img src={image.src} alt={image.alt} loading="lazy" /></figure>)}
    <div className="designid-semantic-body" dangerouslySetInnerHTML={{ __html: mobileComparisonTables(bodyHtml) }} />
  </section>;
}
