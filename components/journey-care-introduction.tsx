import type { JourneyLessonBlock } from "@/lib/journey/dydd-course-outline";
import { JourneyLessonBody } from "@/components/journey-lesson-body";

/** A read-only demonstration using the authored lesson, not workbook prompts. */
export function JourneyCareIntroduction({ blocks }: { blocks: JourneyLessonBlock[] }) {
  const definitionsIndex = blocks.findIndex((block) => block.type === "list");
  const definitions = blocks[definitionsIndex];
  if (definitions?.type !== "list") return <JourneyLessonBody blocks={blocks} />;

  return (
    <div className="journey-care-introduction">
      <JourneyLessonBody blocks={blocks.slice(0, definitionsIndex)} />
      <section className="journey-care-demonstration" aria-label="The CARE process">
        <div className="journey-care-divider" aria-hidden="true">
          {["C", "A", "R", "E"].map((letter) => <span key={letter}>{letter}</span>)}
        </div>
        <div className="journey-care-process">
          {definitions.items.map((definition) => {
            const separator = definition.indexOf(":");
            return (
              <section key={definition}>
                <h4>{definition.slice(0, separator)}</h4>
                <ul><li>{definition.slice(separator + 1).trim()}</li></ul>
              </section>
            );
          })}
        </div>
      </section>
      <aside className="reflection-answer journey-care-information" aria-label="Using the CARE process">
        <JourneyLessonBody blocks={blocks.slice(definitionsIndex + 1)} />
      </aside>
      <aside className="journey-care-record" aria-labelledby="journey-care-record-title">
        <p className="section-label">Your growing personal record</p>
        <h4 id="journey-care-record-title">Small reflections. A clearer picture of your design.</h4>
        <p>
          In later lessons, CARE includes space for your own reflections. Your answers
          are saved in your private workbook as you go—not posted to a group—so you
          can return to them and see how your understanding develops over time.
        </p>
        <p>
          These reflections become a growing personal record to help you discover
          your divine design and write your niche at the end of the course. In your
          Field Kit, you can review your saved answers and earlier walkthroughs,
          revisit your reflections, and download them as a text file to keep.
        </p>
      </aside>
    </div>
  );
}
