import { ReflectionAnswer } from "@/components/reflection-session";
import { whoWhoseCare, whoWhosePrayer } from "@/lib/journey/who-whose-care";

/** Lesson-scoped pilot. Explicit cells reserve CARE positions even when a stage is absent. */
export function JourneyWhoWhoseCare() {
  return <section className="journey-active-workbook care journey-who-whose-care" aria-label="Who vs. Whose CARE reflection">
    <div className="journey-care-heading"><div><p className="section-label">CARE reflection</p><h3>Who Are You and Whose Are You?</h3></div></div>
    <p className="journey-care-reference">Reflections save automatically when you pause typing or leave a field, and before Next. Check each answer’s save status; revisit it in Field Kit. Use <strong>Bring to discussion</strong> to highlight a private reminder for group conversations in Circles. It does not post or automatically share with your Circle.</p>
    <div className="journey-care-response-grid">
      {(["connect", "act", "reflect", "explore"] as const).map(stage => {
        const item = whoWhoseCare.find(item => item.stage === stage);
        return item ? <section className={`journey-care-response-cell ${stage}`} key={stage} data-care-stage={stage} aria-labelledby={`who-whose-${stage}`}>
          <h4 id={`who-whose-${stage}`}><span aria-hidden="true">{item.title[0]}</span>{item.title}</h4>
          <div className="journey-care-response-content"><p>{item.explanation}</p>
            <ReflectionAnswer questionId={item.questionId} />
          </div>
        </section> : <div className={`journey-care-response-cell ${stage} reserved`} key={stage} aria-hidden="true" />;
      })}
    </div>
    <aside className="journey-who-whose-prayer"><h4>Prayer</h4><p>{whoWhosePrayer}</p></aside>
  </section>;
}
