import { JourneyCareDirections } from "@/components/journey-care-directions";
import { ReflectionAnswer } from "@/components/reflection-session";
import { whoWhoseCare, whoWhosePrayer } from "@/lib/journey/who-whose-care";

/** Available stages flow in CARE order without missing-stage placeholders. */
export function JourneyWhoWhoseCare() {
  return <section className="journey-active-workbook care journey-who-whose-care" aria-label="Who vs. Whose CARE reflection">
    <div className="journey-care-heading"><div><p className="section-label">CARE reflection</p><h3>Who Are You and Whose Are You?</h3></div></div>
    <JourneyCareDirections />
    <div className="journey-care-response-grid">
      {(["connect", "act", "reflect", "explore"] as const).map(stage => {
        const item = whoWhoseCare.find(item => item.stage === stage);
        return item ? <section className={`journey-care-response-cell ${stage}`} key={stage} data-care-stage={stage} aria-labelledby={`who-whose-${stage}`}>
          <h4 id={`who-whose-${stage}`}>{item.title}</h4>
          <div className="journey-care-response-content"><p>{item.explanation}</p>
            <ReflectionAnswer questionId={item.questionId} />
          </div>
        </section> : null;
      })}
    </div>
    <aside className="journey-who-whose-prayer"><h4>Prayer</h4><p>{whoWhosePrayer}</p></aside>
  </section>;
}
