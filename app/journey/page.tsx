import Link from "next/link";
import { saveJourneyStageResponses } from "@/app/journey/actions";
import { dyddJourney } from "@/lib/journey/dydd-journey";

const responseLabels = {
  declaration: "Declaration",
  list: "List",
  long_text: "Long response",
  short_text: "Short response",
};

const careLabels = {
  act: "Act",
  connect: "Connect",
  explore: "Explore",
  reflect: "Reflect",
};

type JourneyPageProps = {
  searchParams?: Promise<{
    message?: string;
    saved?: string;
  }>;
};

export default async function JourneyPage({ searchParams }: JourneyPageProps) {
  const params = await searchParams;

  return (
    <main className="journey-shell">
      <nav className="course-nav" aria-label="Journey navigation">
        <Link href="/hq">Back to HQ</Link>
      </nav>

      <header className="journey-hero">
        <div>
          <p className="eyebrow">Full DYDD journey</p>
          <h1>{dyddJourney.title}</h1>
          <p className="lede">
            The book, workbook, and 8-week class are now mapped into a digital
            journey that can become video-led, workbook-driven, database-backed,
            and companion-aware.
          </p>
        </div>
        <aside>
          <span>{dyddJourney.tagline}</span>
          <strong>{dyddJourney.stages.length}</strong>
          <small>journey stages from the source materials</small>
        </aside>
      </header>

      <section className="journey-source-band" aria-label="Source materials">
        <div>
          <p className="section-label">Source material</p>
          <h2>Built from the real class, book, and workbook.</h2>
        </div>
        <ul>
          {dyddJourney.sourceMaterials.map((source) => (
            <li key={source}>{source}</li>
          ))}
        </ul>
      </section>

      <section className="journey-chapter-nav" aria-label="Journey chapter shortcuts">
        {dyddJourney.stages.map((stage, index) => (
          <a href={`#${stage.slug}`} key={stage.slug}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{stage.title}</strong>
            <small>{stage.classWeek}</small>
          </a>
        ))}
      </section>

      {params?.saved ? (
        <p className="journey-save-notice">Saved {params.saved} workbook responses.</p>
      ) : params?.message ? (
        <p className="journey-save-notice">{params.message}</p>
      ) : null}

      <section className="journey-stage-stack" aria-label="Journey stages">
        {dyddJourney.stages.map((stage) => (
          <article className="journey-stage" id={stage.slug} key={stage.slug}>
            <div className="journey-stage-intro">
              <p className="section-label">{stage.classWeek}</p>
              <h2>{stage.title}</h2>
              <p>{stage.summary}</p>
              <small>{stage.sourcePages}</small>
            </div>

            {stage.assessmentCallouts?.length ? (
              <div className="journey-assessment-callouts">
                {stage.assessmentCallouts.map((callout) => (
                  <section key={`${stage.slug}-${callout.assessment}`}>
                    <span>{callout.assessment}</span>
                    <h3>{callout.title}</h3>
                    <p>{callout.body}</p>
                  </section>
                ))}
              </div>
            ) : null}

            <div className="journey-stage-grid">
              <section>
                <h3>Video intro</h3>
                <p>{stage.videoIntro}</p>
              </section>
              <section>
                <h3>Interactive moves</h3>
                <ul>
                  {stage.contentMoves.map((move) => (
                    <li key={move}>{move}</li>
                  ))}
                </ul>
              </section>
              <section>
                <h3>Dydi context</h3>
                <p>{stage.dydiContext}</p>
              </section>
              <section>
                <h3>Database record</h3>
                <p>{stage.databaseRecord}</p>
              </section>
            </div>

            <form action={saveJourneyStageResponses} className="journey-workbook-form">
              <input name="stage_slug" type="hidden" value={stage.slug} />
              <div className="journey-section-stack">
                {stage.sections.map((section, sectionIndex) => (
                  <details key={section.slug} open={sectionIndex === 0}>
                    <summary>
                      <span>{section.sourceRef}</span>
                      <strong>{section.title}</strong>
                      <small>{section.purpose}</small>
                    </summary>
                    <div className="journey-care-grid">
                      {Object.entries(section.care).map(([careStep, body]) => (
                        <section key={`${section.slug}-${careStep}`}>
                          <span>{careLabels[careStep as keyof typeof careLabels]}</span>
                          <p>{body}</p>
                        </section>
                      ))}
                    </div>
                    <div className="journey-prompt-grid">
                      {section.prompts.map((prompt) => (
                        <label key={prompt.id}>
                          <span>
                            {prompt.careStep
                              ? `${careLabels[prompt.careStep]}. `
                              : ""}
                            {prompt.label}
                          </span>
                          {prompt.helper ? <small>{prompt.helper}</small> : null}
                          {prompt.responseType === "short_text" ? (
                            <input name={prompt.id} placeholder="Type here..." />
                          ) : (
                            <textarea
                              name={prompt.id}
                              placeholder={`${responseLabels[prompt.responseType]} staged for Supabase save`}
                              rows={prompt.responseType === "declaration" ? 3 : 5}
                            />
                          )}
                        </label>
                      ))}
                    </div>
                  </details>
                ))}
              </div>

              {stage.pathfinder ? (
                <section className="journey-pathfinder-card">
                  <div>
                    <p className="section-label">Pathfinder</p>
                    <h3>{stage.pathfinder.title}</h3>
                    <p>{stage.pathfinder.body}</p>
                  </div>
                  <div className="journey-prompt-grid">
                    {stage.pathfinder.prompts.map((prompt) => (
                      <label key={prompt.id}>
                        <span>
                          {prompt.careStep ? `${careLabels[prompt.careStep]}. ` : ""}
                          {prompt.label}
                        </span>
                        {prompt.responseType === "short_text" ? (
                          <input name={prompt.id} placeholder="Type here..." />
                        ) : (
                          <textarea
                            name={prompt.id}
                            placeholder={`${responseLabels[prompt.responseType]} staged for Supabase save`}
                            rows={prompt.responseType === "declaration" ? 3 : 5}
                          />
                        )}
                      </label>
                    ))}
                  </div>
                </section>
              ) : null}
              <button className="button secondary" type="submit">
                Save chapter draft
              </button>
            </form>
          </article>
        ))}
      </section>
    </main>
  );
}
