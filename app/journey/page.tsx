import { saveJourneyStageResponses } from "@/app/journey/actions";
import { dyddJourney } from "@/lib/journey/dydd-journey";
import { getFacilitatorPlaybookStage } from "@/lib/journey/facilitator-playbook";
import { PageHelp } from "@/components/page-help";

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

      <PageHelp
        items={[
          "Use the chapter shortcuts to jump to the next unfinished part of the workbook.",
          "Open each section to move through Connect, Act, Reflect, and Explore prompts.",
          "Save chapter drafts as you go; Pathfinder entries build a purpose thread over time.",
        ]}
        title="How to walk the Journey"
      />

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
        {dyddJourney.stages.map((stage) => {
          const playbookStage = getFacilitatorPlaybookStage(stage.slug);

          return (
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

              {stage.sampleLessons?.length ? (
                <section className="journey-sample-lessons" aria-label={`${stage.title} sample lessons`}>
                  <div className="journey-sample-lessons-heading">
                    <p className="section-label">Course receiving structure</p>
                    <h3>Sample lessons that can sit above the workbook flow.</h3>
                    <p>
                      These are starter lesson blocks for the course map you are
                      building now: module introduction, teaching media,
                      practical focus, and the handoff into CARE or Pathfinder.
                    </p>
                  </div>
                  <div className="journey-sample-lesson-grid">
                    {stage.sampleLessons.map((lesson, lessonIndex) => (
                      <article className="journey-sample-lesson" key={lesson.title}>
                        <div className="journey-sample-copy">
                          <div className="journey-sample-title-row">
                            <p className="section-label">{lesson.eyebrow}</p>
                            <h4>{lesson.title}</h4>
                            <span>{lesson.duration}</span>
                          </div>
                          <p className="journey-lesson-summary">{lesson.summary}</p>

                          {lesson.anchorVerse ? (
                            <blockquote className="journey-lesson-verse">
                              <p>{lesson.anchorVerse.text}</p>
                              <cite>{lesson.anchorVerse.reference}</cite>
                            </blockquote>
                          ) : null}

                          <section className="journey-lesson-focus" aria-label={`${lesson.title} focus`}>
                            <p className="section-label">Lesson focus</p>
                            <ul>
                              {lesson.focus.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </section>

                          <div className="journey-lesson-teaching-stack">
                            {lesson.teachingSections.map((section) => (
                              <section key={`${lesson.title}-${section.title}`}>
                                <p className="section-label">{section.label}</p>
                                <h5>{section.title}</h5>
                                {section.body.map((paragraph) => (
                                  <p key={paragraph}>{paragraph}</p>
                                ))}
                              </section>
                            ))}
                          </div>

                          <section className="journey-lesson-practice" aria-label={`${lesson.title} practice`}>
                            <p className="section-label">{lesson.practice.title}</p>
                            <strong>{lesson.practice.prompt}</strong>
                          </section>

                          <p className="journey-lesson-next">
                            <span>Next</span>
                            {lesson.nextStep}
                          </p>
                        </div>
                        <figure
                          className={
                            lesson.mediaType === "video"
                              ? "journey-sample-media video"
                              : "journey-sample-media"
                          }
                        >
                          {lesson.image ? (
                            <img src={lesson.image} alt={lesson.mediaLabel ?? lesson.title} />
                          ) : null}
                          {lesson.mediaType === "video" ? (
                            <span aria-hidden="true" className="journey-video-play">
                              <svg fill="none" viewBox="0 0 42 42">
                                <circle cx="21" cy="21" r="20" fill="#fffaf0" stroke="#243f27" strokeWidth="2" />
                                <path d="m18 14 11 7-11 7V14Z" fill="#476b42" stroke="#243f27" strokeLinejoin="round" strokeWidth="2" />
                              </svg>
                            </span>
                          ) : null}
                          <figcaption>
                            Lesson {String(lessonIndex + 1).padStart(2, "0")} media space
                          </figcaption>
                        </figure>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              <details className="journey-build-accordion">
                <summary>
                  <span>Build notes</span>
                  <strong>Open the video, interaction, Dydi, and database planning layer</strong>
                </summary>
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
              </details>

              {playbookStage ? (
                <details className="journey-facilitator-card" aria-label={`${stage.title} facilitator playbook`}>
                  <summary className="journey-facilitator-heading">
                    <div className="host-playbook-icon mini" aria-hidden="true">
                      <svg fill="none" viewBox="0 0 64 64">
                        <path d="M13 12h25a10 10 0 0 1 10 10v30H23a10 10 0 0 1-10-10Z" fill="#fffaf0" stroke="#243f27" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                        <path d="M22 22h17M22 30h15M22 38h11" stroke="#739d5e" strokeLinecap="round" strokeWidth="3" />
                        <path d="m45 12 7-5 4 8-7 5Z" fill="#d4a451" stroke="#6f4d20" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                      </svg>
                    </div>
                    <div>
                      <p className="section-label">Jordan's facilitator playbook</p>
                      <h3>{playbookStage.session}: {playbookStage.title}</h3>
                    </div>
                  </summary>
                  <div className="facilitator-coach-grid">
                    <section>
                      <span>In the moment</span>
                      <ul>
                        {playbookStage.inTheMoment.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </section>
                    <section>
                      <span>Prepare next</span>
                      <ul>
                        {playbookStage.prepareNext.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </section>
                    <section>
                      <span>Email queue</span>
                      <ul>
                        {playbookStage.emails.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </section>
                    <section>
                      <span>Pull from appendix</span>
                      <ul>
                        {playbookStage.resources.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  </div>
                </details>
              ) : null}

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
          );
        })}
      </section>
    </main>
  );
}
