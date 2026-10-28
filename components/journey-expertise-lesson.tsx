import { JourneyCareDirections } from "@/components/journey-care-directions";
import { ReflectionAnswer } from "@/components/reflection-session";
import { identityExpertiseMatrix, identityExpertiseReflectQuestion, type ExpertiseLesson } from "@/lib/journey/expertise-lessons";
import type { JourneyLessonBlock } from "@/lib/journey/dydd-course-outline";

// Preserve the complete authored quote/citation, including original punctuation and book names.
// Split only actual Scripture citations; ordinary quotation marks remain ordinary prose.
const verse = /(?:Psalm 46:10 says, |Ephesians 2:10: )“[^”]+”[.]?|“[^”]+”[.,]?\s*(?:\((?:Psalm|John|Philippians|Ephesians|1? ?Peter|Proverbs|Luke|Acts|Colossians|Hebrews|Exodus)\s+\d+:\d+\)|(?:Psalm|John|Philippians|Ephesians|1? ?Peter|Proverbs|Luke|Acts|Colossians|Hebrews|Exodus)\s+\d+:\d+)[.]?/g;
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
export function JourneyExpertiseCare({ lesson, reflectionNames }: { lesson: ExpertiseLesson; reflectionNames?: {primary: string; secondary: string} }) {
  const identityExpertise = lesson.sourceRow === 31;
  return <section className="journey-active-workbook care journey-who-whose-care journey-expertise-care" aria-label={`${lesson.title} CARE reflection`}>
    <div className="journey-care-heading"><div><p className="section-label">CARE reflection</p><h3>{lesson.careTitle}</h3></div></div>
    {lesson.careIntro ? <div className="journey-expertise-care-intro"><AuthoredCopy text={lesson.careIntro} /></div> : null}
    <JourneyCareDirections />
    {identityExpertise ? <>
      <div className="journey-expertise-matrix" aria-label="Reflection talent, competency, and expertise continuum">
        <table><caption>The Reflections: Talent – Competency – Expertise</caption><thead><tr>{identityExpertiseMatrix.headers.map(h => <th scope="col" key={h}>{h}</th>)}</tr></thead><tbody>{identityExpertiseMatrix.rows.map(row => <tr key={row[0]} data-reflection={row[0].toLowerCase()}><th scope="row">{row[0]}</th>{row.slice(1).map(cell => <td key={cell}>{cell}</td>)}</tr>)}</tbody></table>
        <div className="journey-expertise-matrix-cards">{identityExpertiseMatrix.rows.map(row => <section key={row[0]} data-reflection={row[0].toLowerCase()}><h4>{row[0]}</h4><dl>{row.slice(1).map((cell,i) => <div key={cell}><dt>{identityExpertiseMatrix.headers[i+1]}</dt><dd>{cell}</dd></div>)}</dl></section>)}</div>
      </div>
      <section className="journey-identity-expertise-reflect" data-care-stage="reflect"><h4>Reflect</h4><p id="identity-expertise-reflect-prompt">{identityExpertiseReflectQuestion}</p>
        <div className="journey-care-response-grid">{lesson.care.map((item,i) => {
          const name = i === 0 ? reflectionNames?.primary : reflectionNames?.secondary;
          return <section className="journey-care-response-cell reflect" key={item.questionId}>
            <h5 id={`${item.questionId}-label`}>{item.title} — {name || "Not available in your saved report"}</h5>
            {!name ? <p role="status">Your {item.title.toLowerCase()} reflection will appear when your saved DesignID report is connected to this account.</p> : null}
            <div role="group" aria-labelledby={`${item.questionId}-label`} aria-describedby="identity-expertise-reflect-prompt"><ReflectionAnswer questionId={item.questionId} showQuestion={false} /></div>
          </section>;
        })}</div>
      </section>
    </> : <div className="journey-care-response-grid">{lesson.care.map(item => <section className={`journey-care-response-cell ${item.stage}`} key={item.stage} data-care-stage={item.stage}>
      <h4>{item.title}</h4><div className="journey-care-response-content">
        {item.explanation ? <AuthoredCopy text={item.explanation} /> : null}
        <div className="journey-expertise-prompt" id={`${item.questionId}-prompt`}><AuthoredCopy text={item.prompt} /></div>
        <div role="group" aria-labelledby={`${item.questionId}-prompt`}><ReflectionAnswer questionId={item.questionId} showQuestion={false} /></div>
      </div>
    </section>)}</div>}
    {lesson.prayer ? <aside className="journey-who-whose-prayer"><h4>Prayer</h4><AuthoredCopy text={lesson.prayer} /></aside> : null}
  </section>;
}
