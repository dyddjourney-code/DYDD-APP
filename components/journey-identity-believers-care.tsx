import { JourneyCareDirections } from "@/components/journey-care-directions";
import { ReflectionAnswer } from "@/components/reflection-session";
import { identityBelieversCare, identityBelieversPrayer } from "@/lib/journey/identity-believers-care";

/** Authored non-assessment CARE; every stage stays beside its saved response. */
export function JourneyIdentityBelieversCare() {
  return <section className="journey-active-workbook care journey-who-whose-care journey-identity-believers-care" aria-label="Identity among believers CARE reflection">
    <div className="journey-care-heading"><div><p className="section-label">CARE reflection</p><h3>Your Identity Among Believers</h3></div></div>
    <JourneyCareDirections />
    <div className="journey-care-response-grid">
      {identityBelieversCare.map(item => <section className={`journey-care-response-cell ${item.stage}`} key={item.stage} data-care-stage={item.stage}>
        <h4>{item.title}</h4>
        <div className="journey-care-response-content">
          {item.explanation ? <p>{item.explanation}</p> : null}
          <ReflectionAnswer questionId={item.questionId} />
        </div>
      </section>)}
    </div>
    <aside className="journey-who-whose-prayer"><h4>Prayer</h4><p>{identityBelieversPrayer}</p></aside>
  </section>;
}
