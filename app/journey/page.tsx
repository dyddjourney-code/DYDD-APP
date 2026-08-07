import Link from "next/link";
import { saveJourneyStageResponses } from "@/app/journey/actions";
import { dyddJourney } from "@/lib/journey/dydd-journey";

const responseLabels = {
  declaration: "Declaration",
  list: "List",
  long_text: "Long response",
  short_text: "Short response",
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
              {stage.prompts.map((prompt) => (
                <label key={prompt.id}>
                  <span>
                    {prompt.careStep ? `${prompt.careStep}. ` : ""}
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
              <button className="button secondary" type="submit">
                Save draft
              </button>
            </form>
          </article>
        ))}
      </section>
    </main>
  );
}
