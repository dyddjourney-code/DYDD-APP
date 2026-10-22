import { JourneyCareDirections } from "@/components/journey-care-directions";
import { ReflectionAnswer } from "@/components/reflection-session";
import { oneAnotherCare } from "@/lib/journey/one-another-care";
export function JourneyOneAnotherCare() {
  return <section className="journey-active-workbook care journey-who-whose-care journey-one-another-care" aria-label="Reflections and One Anothering CARE reflection">
    <div className="journey-care-heading"><div><p className="section-label">CARE reflection</p><h3>Reflections and One Anothering</h3></div></div>
    <JourneyCareDirections />
    <div className="journey-care-response-grid">{oneAnotherCare.map(item => <section className={`journey-care-response-cell ${item.stage}`} key={item.stage} data-care-stage={item.stage}>
      <h4>{item.title}</h4><div className="journey-care-response-content"><p>{item.explanation}</p>{"questionId" in item ? <ReflectionAnswer questionId={item.questionId} /> : null}</div>
    </section>)}</div>
  </section>;
}
