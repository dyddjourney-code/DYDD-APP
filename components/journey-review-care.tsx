import { JourneyCareDirections } from "@/components/journey-care-directions";
import { ReflectionAnswer } from "@/components/reflection-session";
import type { JourneyReviewLesson } from "@/lib/journey/review-lessons";
const stages = ["connect", "act", "reflect", "explore"] as const;
export function JourneyReviewPrayer({lesson}: {lesson: JourneyReviewLesson}) {
  return lesson.prayer ? <aside className="journey-who-whose-prayer"><h4>Prayer</h4><p>{lesson.prayer}</p></aside> : null;
}
export function JourneyReviewCare({lesson}: {lesson: JourneyReviewLesson}) {
  return <section className="journey-active-workbook care journey-who-whose-care journey-expertise-care journey-review-care" aria-label={lesson.title + " CARE reflection"}>
    <div className="journey-care-heading"><div><p className="section-label">CARE reflection</p><h3>{lesson.title}</h3></div></div>
    {lesson.careIntro ? <div className="journey-expertise-care-intro"><p>{lesson.careIntro}</p></div> : null}
    <JourneyCareDirections />
    <div className="journey-care-response-grid">{stages.map(stage => <section className={"journey-care-response-cell " + stage} data-care-stage={stage} key={stage}>
      <h4>{stage[0].toUpperCase() + stage.slice(1)}</h4>
      <div className="journey-care-response-content">
        <p>{lesson.care.find(item => item.stage === stage)?.explanation}</p>
        {lesson.prompts.filter(p => p.careStep === stage).map(prompt => <div key={prompt.id}>
          <p className="journey-review-prompt" id={prompt.id + "-prompt"}>{prompt.label}</p>
          <div role="group" aria-labelledby={prompt.id + "-prompt"}><ReflectionAnswer questionId={prompt.id} showQuestion={false} /></div>
        </div>)}
      </div>
    </section>)}</div>
    <JourneyReviewPrayer lesson={lesson} />
    {lesson.nextStep ? <p className="journey-review-next-step">{lesson.nextStep}</p> : null}
  </section>;
}
