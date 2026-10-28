import Link from "next/link";
import { withCourseOrigin } from "@/lib/trails/course-origin";
import { isSandbox } from "@/lib/environment";
import { trailDefinitions } from "@/lib/trails/catalog";
import { withReviewQuery, type ReviewSearchParams } from "@/lib/review/heather";
export type CollectedArtifact = {
  id?: string;
  completedAt?: string;
  action: string;
  pdfHref?: string;
  pdfReady?: boolean;
  courseAction?: string | null;
  courseHref?: string | null;
  detail: string;
  href: string;
  logo: string;
  meta: Array<[string, string]>;
  title: string;
  experienceSlug?: string;
};
const assessmentIcons: Record<string, string> = {
  "designid-foundations": "/brand/tools/badge-icons/designid-icon.png",
  "spiritual-gifts-service": "/brand/tools/badge-icons/spiritual-gifts-icon.png",
  "fruitlife-360-formation": "/brand/tools/badge-icons/fruitlife-360-icon.png",
  "designpd-alignment": "/brand/tools/badge-icons/designpd-icon.png",
};
function ReportRow({ artifact, latest = false }: { artifact: CollectedArtifact; latest?: boolean }) {
  const timestamp =
    artifact.meta.find(([label]) => label === "Completed")?.[1] ??
    artifact.detail.replace(/^Completed\s+/i, "").replace(/\.$/, "");
  const status = artifact.meta.find(([label]) => label === "Status")?.[1];
  return (
    <article className="fieldkit-report-row">
      <div>
        <h5>{artifact.title}</h5>
        <p className="fieldkit-report-date">{timestamp}{latest ? " · Latest" : ""}</p>
        {status && status.toLowerCase() !== "completed" ? (
          <span className="fieldkit-report-status">{status}</span>
        ) : null}
      </div>
      <div className="fieldkit-report-actions">
        <Link className="button secondary" href={artifact.href} target="_blank" rel="noopener noreferrer" prefetch={false}>
          {artifact.action}
        </Link>
        {artifact.pdfHref ? (
          <Link className="button primary" href={artifact.pdfHref} target="_blank" rel="noopener noreferrer" prefetch={false}>
            Download PDF
          </Link>
        ) : <span className="fieldkit-report-status">Snapshot only — original PDF unavailable</span>}
      </div>
    </article>
  );
}
export function FieldKitCollection({
  artifacts,
  rounds,
  reviewParams,
}: {
  artifacts: CollectedArtifact[];
  rounds: Array<{
    course_slug: string;
    started_at: string;
  }>;
  reviewParams?: ReviewSearchParams;
}) {
  const section = (
    slug: string,
    name: string,
    description: string,
    courseHref: string,
    number: string,
    main = false,
  ) => {
    const reports = artifacts
      .filter((a) => a.experienceSlug === slug)
      .sort(
        (a, b) =>
          new Date(b.completedAt ?? 0).getTime() -
          new Date(a.completedAt ?? 0).getTime(),
      );
    const saved = rounds.filter((r) => r.course_slug === slug);
    const trail = trailDefinitions.find((t) => t.courseSlug === slug);
    const needsDesignId = trail?.id === "designpd" && !artifacts.some((a) => a.experienceSlug === "designid-foundations");
    const path = (href: string) => withReviewQuery(href, reviewParams);
    const assessmentEntry = !main && !reports.length && trail ? (
      <div className="fieldkit-assessment-entry">
        <Link className="button primary" href={path(trail.id === "designpd" && !needsDesignId ? withCourseOrigin(trail.assessmentHref, "field-kit") : needsDesignId ? "/designid" : trail.assessmentHref)}>
          Take assessment
        </Link>
        {needsDesignId ? <p>Complete DesignID first to open DesignPD.</p> : null}
      </div>
    ) : null;
    const collectionDetails = (<>
          <div className="fieldkit-collection-columns">
            <section aria-label={`${name} reports`}>
              <p className="section-label">Reports</p>
              <h4>
                {main ? "Your connected discoveries" : "Your latest reports"}
              </h4>
              {main ? (
                <p>
                  Your assessment reports are organized by trail below. Bring
                  them into your Journey whenever you need them.
                </p>
              ) : reports.length ? (
                <div className="fieldkit-report-history">
                  {reports.slice(0, 1).map((artifact) => (
                    <ReportRow
                      key={artifact.id ?? artifact.href}
                      artifact={artifact}
                      latest
                    />
                  ))}
                  {reports.length > 1 ? (
                    <details className="fieldkit-older-reports">
                      <summary>
                        Assessment history ({reports.length - 1})
                      </summary>
                      <div className="fieldkit-older-report-list">
                        {reports.slice(1).map((artifact) => (
                          <ReportRow
                            key={artifact.id ?? artifact.href}
                            artifact={artifact}
                          />
                        ))}
                      </div>
                    </details>
                  ) : null}
                </div>
              ) : (
                <>
                  <p>No completed report yet. Take the assessment to begin; your completed report will collect here.</p>
                  {assessmentEntry}
                </>
              )}
            </section>
            <section aria-label={`${name} course reflections`}>
              <p className="section-label">Course Reflections</p>
              <h4>
                {saved.length
                  ? `${saved.length} dated reflection ${saved.length === 1 ? "round" : "rounds"}`
                  : "Your personal workbook"}
              </h4>
              <p>
                {saved.length
                  ? "Return to your current answers or read previous dated reflections. New rounds keep earlier discoveries intact."
                  : "Keep every question and your answers together, including questions you haven’t answered yet."}
              </p>
              <Link
                className="button primary"
                href={path(`/field-kit/reflections/${slug}`)}
              >
                Review my reflections
              </Link>
              {main ? <Link className="button secondary" href={path(`/field-kit/reflections/${slug}?view=discussion#discussion-reminders`)}>My discussion reminders</Link> : null}
            </section>
          </div>
          <div className="fieldkit-collection-footer">
            <Link className="button secondary" href={path(slug === "designpd-alignment" || slug === "fruitlife-360-formation" || slug === "spiritual-gifts-service" ? withCourseOrigin(courseHref, "field-kit") : courseHref)}>
              Continue course
            </Link>
            {!main ? (
              <Link
                href={path(
                  `/trailheads#${trailDefinitions.find((t) => t.courseSlug === slug)?.id ?? ""}`,
                )}
              >
                Return to Trailhead
              </Link>
            ) : (
              <p>
                The same workbook is available here and inside your Journey.
              </p>
            )}
            {!main ? <Link href="/gear">Add feedback</Link> : null}
          </div>
    </>);
    return (
      <div
        className={`trail-placard fieldkit-collection${main ? " trail-placard-main" : ""}`}
      >
        <div className="trail-placard-top">
          <span>DYDD · FIELD KIT</span>
          <span>{number}</span>
        </div>
        <div className="trail-placard-body">
          {main ? (
            <img
              className="trail-dydd-logo"
              src="/brand/dydd-logo-trailheads.webp"
              alt="Discover Your Divine Design"
            />
          ) : null}
          {assessmentIcons[slug] ? (
            <div className="fieldkit-collection-heading">
              <h3>{name}</h3>
              <img
                className="fieldkit-collection-icon"
                src={assessmentIcons[slug]}
                alt=""
                width={40}
                height={40}
              />
            </div>
          ) : <h3>{name}</h3>}
          <p className="trail-description">{description}</p>
          <div className="fieldkit-mobile-summary">
            <p className="fieldkit-mobile-status">{main ? "Journey workbook" : reports.length ? `${reports.length} completed ${reports.length === 1 ? "report" : "reports"}` : "No completed report yet"} · {saved.length ? `${saved.length} reflection ${saved.length === 1 ? "round" : "rounds"}` : "No reflection rounds yet"}</p>
            {assessmentEntry}
            <Link className="button secondary" href={path(`/field-kit/reflections/${slug}`)}>Review my reflections</Link>
          </div>
          <details className="fieldkit-mobile-details">
            <summary>Reports, workbook &amp; course details</summary>
            {collectionDetails}
          </details>
          <div className="fieldkit-desktop-details">{collectionDetails}</div>
        </div>
        <div className="trail-placard-foot" aria-hidden="true">
          <span />
          KEEP WHAT YOU DISCOVER
          <span />
        </div>
      </div>
    );
  };
  return (
    <section
      id="artifacts"
      className="fieldkit-collections"
      aria-label="Collected reports and reflections"
    >
      <section
        className="trail-main-route"
        aria-label="Main Journey collection"
      >
        <div className="trail-section-title">
          <p className="section-label">The main journey</p>
          <h2>Discover Your Divine Design.</h2>
          <p>
            Your complete Journey workbook, ready to revisit inside or outside
            the class.
          </p>
        </div>
        <article className="trail-showcase">
          <div className="trail-showcase-art">
            <img
              src="/brand/dydd-trailheads-signpost-dydi.png"
              alt="Discover Your Divine Design trail sign"
            />
          </div>
          <div className="trail-showcase-content">
            {section(
              "discover-your-divine-design",
              "Discover Your Divine Design Journey",
              "Collect your reflections on identity, design, gifting, and purpose—and return to them as you shape your niche.",
              "/journey",
              "01",
              true,
            )}
          </div>
        </article>
      </section>
      {[
        {
          label: "Focused trails",
          title: "Your practical first steps.",
          description:
            "Your reports and course reflections, organized by the trail you explored.",
          trails: trailDefinitions.filter((t) => t.id !== "designpd"),
        },
        {
          label: "Extended trails",
          title: "Build on what you’ve discovered.",
          description:
            "DesignPD adds its own reports and reflection workbook to your DesignID discoveries.",
          trails: trailDefinitions.filter((t) => t.id === "designpd"),
        },
      ].map((group) => (
        <section className="trail-guide-section" key={group.label}>
          <div className="trail-section-title">
            <p className="section-label">{group.label}</p>
            <h2>{group.title}</h2>
            <p>{group.description}</p>
          </div>
          <div className="trail-guide-routes">
            {group.trails.map((t) => (
              <article
                className={`trail-guide-route trail-guide-route-${t.id}`}
                key={t.id}
                id={`collection-${t.id}`}
              >
                <div className="trail-guide-route-art">
                  <img
                    src={t.signpost}
                    width={832}
                    height={820}
                    alt={`${t.name} trail signpost`}
                    loading="lazy"
                  />
                </div>
                {section(
                  t.courseSlug,
                  t.name,
                  t.description,
                  t.courseHref,
                  String(trailDefinitions.indexOf(t) + 2).padStart(2, "0"),
                )}
              </article>
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}
