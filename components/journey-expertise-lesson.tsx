import { JourneyCareDirections } from "@/components/journey-care-directions";
import { ReflectionAnswer } from "@/components/reflection-session";
import type { ExpertiseLesson } from "@/lib/journey/expertise-lessons";
import type { JourneyLessonBlock } from "@/lib/journey/dydd-course-outline";

// Preserve the complete authored quote/citation, including original punctuation and book names.
// Split only actual Scripture citations; ordinary quotation marks remain ordinary prose.
const verse = /“[^”]+”[.,]?\s*(?:\((?:Philippians|Ephesians|1? ?Peter|Proverbs|Luke|Acts|Colossians|Hebrews|Exodus)\s+\d+:\d+\)|(?:Philippians|Ephesians|1? ?Peter|Proverbs|Luke|Acts|Colossians|Hebrews|Exodus)\s+\d+:\d+)[.]?/g;
function AuthoredCopy({ text }: { text: string }) {
  const parts = []; let from = 0;
  for (const match of text.matchAll(verse)) {
    if (match.index > from) parts.push(<p key={from}>{text.slice(from, match.index)}</p>);
    parts.push(<blockquote className="journey-closing-scripture" key={`verse-${match.index}`}><p>{match[0]}</p></blockquote>);
    from = match.index + match[0].length;
  }
  if (from < text.length) parts.push(<p key={from}>{text.slice(from)}</p>);
  return <>{parts}</>;
}
export function JourneyExpertiseBody({ blocks }: { blocks: JourneyLessonBlock[] }) {
  return <>{blocks.map((block, i) => block.type === "heading" ? <h4 className="lesson-body-subheading" key={i}>{block.text}</h4> : block.type === "paragraph" ? <AuthoredCopy text={block.text} key={i} /> : block.type === "list" ? <ul className="lesson-body-list" key={i}>{block.items.map(item => <li key={item}><AuthoredCopy text={item} /></li>)}</ul> : null)}</>;
}
export function JourneyExpertiseCare({ lesson }: { lesson: ExpertiseLesson }) {
  return <section className="journey-active-workbook care journey-who-whose-care journey-expertise-care" aria-label={`${lesson.title} CARE reflection`}>
    <div className="journey-care-heading"><div><p className="section-label">CARE reflection</p><h3>{lesson.careTitle}</h3></div></div>
    {lesson.careIntro ? <div className="journey-expertise-care-intro"><AuthoredCopy text={lesson.careIntro} /></div> : null}
    <JourneyCareDirections />
    <div className="journey-care-response-grid">{lesson.care.map(item => <section className={`journey-care-response-cell ${item.stage}`} key={item.stage} data-care-stage={item.stage}>
      <h4>{item.title}</h4><div className="journey-care-response-content">
        {item.explanation ? <AuthoredCopy text={item.explanation} /> : null}
        <div className="journey-expertise-prompt" id={`${item.questionId}-prompt`}><AuthoredCopy text={item.prompt} /></div>
        <div role="group" aria-labelledby={`${item.questionId}-prompt`}><ReflectionAnswer questionId={item.questionId} showQuestion={false} /></div>
      </div>
    </section>)}</div>
    {lesson.prayer ? <aside className="journey-who-whose-prayer"><h4>Prayer</h4><AuthoredCopy text={lesson.prayer} /></aside> : null}
  </section>;
}
