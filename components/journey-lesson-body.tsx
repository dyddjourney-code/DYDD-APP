import type { JourneyLessonBlock } from "@/lib/journey/dydd-course-outline";
import { ReviewAwareLink } from "@/components/review-aware-link";

/** Authored content only: explicit blocks, never HTML or spreadsheet instructions. */
export function JourneyLessonBody({ blocks, closingCallout = false, identityPathfinder = false }: { blocks: JourneyLessonBlock[]; closingCallout?: boolean; identityPathfinder?: boolean }) {
  const teaching = closingCallout ? blocks.slice(0, -3) : blocks;
  return <>{teaching.map((block, index) => {
    switch (block.type) {
      case "table":
        return <div key={index} className="journey-authored-table-scroll" role="region" aria-label={block.label} tabIndex={0}><table className="journey-authored-table"><caption>{block.label}</caption><thead><tr>{block.headers.map(header => <th scope="col" key={header}>{header}</th>)}</tr></thead><tbody>{block.rows.map((row, rowIndex) => <tr key={rowIndex} data-reflection={["Architect", "Artisan", "Shepherd", "Steward"].includes(row[0].trim()) ? row[0].trim().toLowerCase() : undefined}>{row.map((cell, cellIndex) => cellIndex === 0 ? <th scope="row" key={cellIndex}>{cell}</th> : <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>;
      case "heading":
        return <h4 className="lesson-body-subheading" key={index}>{block.text}</h4>;
      case "paragraph":
        if (identityPathfinder && /^● (Ephesians|1 Peter|Romans) /.test(block.text)) return <blockquote className="journey-closing-scripture" key={index}><p>{block.text.replace(/^● /, "")}</p></blockquote>;
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
  })}{closingCallout ? <aside className="journey-niche-closing">{blocks.slice(-3).map((block, index) => block.type === "paragraph" ? <p key={index}>{block.text}</p> : null)}</aside> : null}</>;
}
