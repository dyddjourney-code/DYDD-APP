import type { JourneyLessonBlock } from "@/lib/journey/dydd-course-outline";
import { ReviewAwareLink } from "@/components/review-aware-link";

/** Authored content only: explicit blocks, never HTML or spreadsheet instructions. */
export function JourneyLessonBody({ blocks }: { blocks: JourneyLessonBlock[] }) {
  return blocks.map((block, index) => {
    switch (block.type) {
      case "heading":
        return <h4 className="lesson-body-subheading" key={index}>{block.text}</h4>;
      case "paragraph":
        return <p key={index}>{block.text}</p>;
      case "list":
        return <ul className="lesson-body-list" key={index}>{block.items.map((item) => <li key={item}>{item}</li>)}</ul>;
      case "scripture":
        return <blockquote className="journey-closing-scripture" key={index}><p>“{block.text}”</p><cite>{block.reference}</cite></blockquote>;
      case "image":
        return <figure className="journey-inline-book" key={index}><img src={block.src} alt={block.alt} loading="lazy" /></figure>;
      case "link":
        return <p key={index}><ReviewAwareLink href={block.href}>{block.text}</ReviewAwareLink></p>;
    }
  });
}
