import { isOwnerCoursePreview, designIdCourseReviewParams } from "@/lib/trails/course-preview";
import Link from "next/link";
import { TrailDetails } from "@/components/trail-details";
import { TrailPlacard } from "@/components/trail-placard";
import { TrailResumeLink } from "@/components/trail-resume-link";
import { FruitLifeMiniNav } from "@/components/fruitlife-mini-nav";
import { FruitLifeMiniFooter } from "@/components/fruitlife-mini-footer";
import {
  getAssessmentSnapshotsForUser,
  latestByAssessment,
} from "@/lib/assessments/student-context";
import {
  getFruitLifeDashboardSessions,
  fruitLifeIsActive,
  fruitLifeReportArtifact,
} from "@/lib/fruitlife360/dashboard";
import { hasDesignPdCourseAccess } from "@/lib/designpd/access";
import { userHasFruitLifeEntitlement } from "@/lib/commerce/fruitlife-entitlements";
import { normalizeEmail } from "@/lib/identity/email";
import {
  getHeatherReviewReport,
  getNewReviewReport,
  isHeatherReviewRequest,
  isNewReviewRequest,
  heatherReviewEmail,
  jordanReviewEmail,
  reviewQuery,
  withReviewQuery,
  type ReviewSearchParams,
} from "@/lib/review/heather";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  trailDefinitions,
  isTrailAssessmentComplete,
} from "@/lib/trails/catalog";

export const dynamic = "force-dynamic";
type Props = {
  searchParams?: Promise<
    ReviewSearchParams & { lane?: string; from?: string; checkout?: string }
  >;
};
export default async function TrailheadsPage({ searchParams }: Props) {
  const params = designIdCourseReviewParams(await searchParams);
  const mini = params?.lane === "fruitlife";
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase
        .from("school_profiles")
        .select("email")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };
  const email = isHeatherReviewRequest(params)
    ? heatherReviewEmail
    : isNewReviewRequest(params)
      ? jordanReviewEmail
      : normalizeEmail(profile?.email ?? user?.email);
  const preview =
    (await getHeatherReviewReport(params)) ??
    (await getNewReviewReport(params));
  const report =
    preview ??
    (user
      ? await getAssessmentSnapshotsForUser(user.id, email)
      : { all: [], latest: [] });
  const snapshots = latestByAssessment(report.all);
  const ownPdReport =
    preview && user
      ? await getAssessmentSnapshotsForUser(user.id, normalizeEmail(user.email))
      : report;
  const checkoutNotice =
    params?.checkout === "success"
      ? "FruitLife360 is unlocked. You can start your assessment now."
      : params?.checkout === "cancelled"
        ? "Checkout was cancelled. You can return when you are ready."
        : params?.checkout === "required"
          ? "Unlock FruitLife360 to begin your assessment."
          : params?.checkout
            ? "Your checkout could not be confirmed. Please return to your Field Kit or try again."
            : null;
  const sessions = await getFruitLifeDashboardSessions({
    email,
    enabled: Boolean(email),
  });
  const active = sessions.find(fruitLifeIsActive);
  const fruitReady = sessions.some((session) =>
    Boolean(fruitLifeReportArtifact(session)),
  );
  const fruitPermit =
    mini && user ? await userHasFruitLifeEntitlement(user.id) : false;
  const fromJourney = params?.from === "journey";
  const path = (href: string) => withReviewQuery(href, params);
  const fieldKit = path(mini ? "/field-kit?lane=fruitlife" : "/field-kit");
  const trails = trailDefinitions.filter(
    (trail) => !mini || ["spiritual-gifts", "fruitlife-360"].includes(trail.id),
  );
  return (
    <main
      className={`journey-shell hq-standalone-page trailhead-renewal${mini ? " fruitlife-release-shell" : ""}`}
    >
      {mini ? <FruitLifeMiniNav reviewQuery={reviewQuery(params)} /> : null}
      <header className="standalone-hero trailheads-hero">
        <div>
          <p className="eyebrow">Trailheads</p>
          <h1>Take your next faithful step.</h1>
          <p className="lede">
            Trailheads are courses that pair personal assessments with practical
            teaching to help you understand your design, deepen your faith, and
            live with purpose.
          </p>
        </div>
      </header>
      {mini && checkoutNotice ? (
        <p className="form-message" role="status">
          {checkoutNotice}
        </p>
      ) : null}
      {fromJourney ? (
        <aside className="trail-return-note">
          <strong>Your Journey is holding your place.</strong>
          <span>Explore this trail, then return to the lesson you left.</span>
          <Link className="button secondary" href={path("/journey")}>
            Return to My Journey
          </Link>
        </aside>
      ) : null}
      {!mini ? (
        <section className="trail-main-route" aria-label="Main journey">
          <div className="trail-section-title">
            <p className="section-label">The main journey</p>
            <h2>Understand your design. Live with purpose.</h2>
          </div>
          <article className="trail-showcase">
            <div className="trail-showcase-art">
              <img
                src="/brand/dydd-trailheads-signpost-dydi.png"
                alt="Dydi beside the Discover Your Divine Design trail sign"
              />
            </div>
            <div className="trail-showcase-content">
              <img
                className="trail-dydd-logo"
                src="/brand/dydd-logo-trailheads.webp"
                alt="Discover Your Divine Design"
              />
              <TrailPlacard
                number="01"
                name="Discover Your Divine Design Journey"
                description="A guided journey through identity, design, gifting, and calling—connecting what you discover to the life God is inviting you to live."
                rating="Challenging"
                ratingNote="A deeper commitment to discovery, reflection, and faithful action—one step at a time."
                terrain="Guided teaching, personal reflection, and everyday application"
                gear="Discover Your Divine Design book and a place to reflect"
                bestFor="Anyone seeking clarity about their God-given design and purpose"
                permit="Included"
                main
                details={<TrailDetails trailId="journey" />}
              >
                <p className="trail-prerequisite">
                  No assessment needed to begin. Explore the connected
                  assessments as you go.
                </p>
                <TrailResumeLink
                  href={path("/journey")}
                  progressKey="dydd-journey-position"
                  startLabel="Start the Journey"
                  continueLabel="Continue My Journey"
                />
              </TrailPlacard>
            </div>
          </article>
        </section>
      ) : null}
      {[
        { id: "focused", trails: trails.filter((trail) => trail.id !== "designpd") },
        ...(!mini ? [{ id: "extended", trails: trails.filter((trail) => trail.id === "designpd") }] : []),
      ].map((group) => (
      <section
        className="trail-short-routes"
        aria-label={group.id === "extended" ? "Extended trails" : "Focused trails"}
        id={group.id === "extended" ? "optional-expansions" : "subscription-assessments"}
        key={group.id}
      >
        <div className="trail-section-title">
          <p className="section-label">{group.id === "extended" ? "Extended trails" : "Focused trails"}</p>
          <h2>{group.id === "extended" ? "Put your design into action." : "Practical first steps."}</h2>
          <p>
            {group.id === "extended"
              ? "Go further with what you have discovered. DesignPD builds on DesignID to help you understand how you plan, decide, and do—and apply that insight in everyday life."
              : "Not ready for the full Journey? Start with one area: your design, spiritual gifts, or growth in Christ. Take the assessment, explore your results, and follow the course into everyday practice."}
          </p>
        </div>
        <div className="trail-guide-route-list">
          {group.trails.map((trail) => {
            const complete =
              isTrailAssessmentComplete(trail.assessmentType, report.all) ||
              (trail.id === "fruitlife-360" && fruitReady);
            const pdAccess =
              trail.id !== "designpd" ||
              Boolean(
                user &&
                  isTrailAssessmentComplete("designpd", ownPdReport.all) &&
                  hasDesignPdCourseAccess(user.email, ownPdReport.all),
              );
            const ready = complete && pdAccess;
            const designIdReady = snapshots.some(
              (s) => s.assessment_type === "designid",
            );
            const inProgress = trail.id === "fruitlife-360" && Boolean(active);
            let startHref: string = trail.assessmentHref;
            if (mini && trail.id === "spiritual-gifts")
              startHref += "&lane=fruitlife";
            if (trail.id === "fruitlife-360") {
              startHref = inProgress
                ? `${mini ? "/field-kit?lane=fruitlife" : "/field-kit"}#current-assessment-process`
                : mini && !fruitPermit
                  ? `/api/stripe/fruitlife-checkout?return_to=${encodeURIComponent("/trailheads?lane=fruitlife")}`
                  : mini
                    ? `/fruitlife360?return_to=${encodeURIComponent("/field-kit?lane=fruitlife#current-assessment-process")}`
                    : "/fruitlife360";
            }
            if (trail.id === "designpd" && !designIdReady)
              startHref = "/designid";
            const courseHref = path(
              `${trail.courseHref}${mini ? "?lane=fruitlife" : ""}`,
            );
            return (
              <article
                className={`trail-guide-route trail-guide-route-${trail.id}`}
                id={trail.id}
                key={trail.id}
              >
                <div className="trail-guide-route-art">
                  <img
                    src={trail.signpost}
                    alt={`${trail.name} trail signpost`}
                    loading="lazy"
                  />
                </div>
                <TrailPlacard
                  number={String(trailDefinitions.indexOf(trail) + 2).padStart(2, "0")}
                  name={trail.name}
                  assessmentIcon={`/brand/tools/badge-icons/${trail.id}-icon.png`}
                  description={trail.description}
                  details={<TrailDetails trailId={trail.id} />}
                  rating={trail.rating}
                  ratingNote={trail.ratingNote}
                  terrain={trail.terrain}
                  gear={trail.gear}
                  bestFor={trail.bestFor}
                  permit={
                    trail.id === "designpd"
                      ? complete
                        ? "Expansion unlocked"
                        : "$15 optional expansion"
                      : mini && trail.id === "fruitlife-360"
                        ? fruitPermit
                          ? "Unlocked"
                          : "$10 assessment"
                        : "Included"
                  }
                >
                  <ol
                    className="trail-step-strip"
                    aria-label={`${trail.name} progression`}
                  >
                    <li className={complete ? "complete" : "current"}>
                      <span>01</span>
                      {trail.id === "designpd" ? "Report" : "Assessment"}
                      <small>
                        {complete
                          ? "Completed"
                          : inProgress
                            ? "In progress"
                            : "Begin here"}
                      </small>
                    </li>
                    <li className={complete ? "complete" : ""}>
                      <span>02</span>Explore results
                      <small>
                        {complete ? "Saved in Field Kit" : "After discovery"}
                      </small>
                    </li>
                    <li className={ready ? "current" : ""}>
                      <span>03</span>Take the course
                      <small>
                        {ready ? "Ready to explore" : "Results required"}
                      </small>
                    </li>
                  </ol>
                  <p className="trail-prerequisite">
                    {trail.id === "designpd" && !designIdReady
                      ? "Complete DesignID first. Then unlock your DesignPD report and its course."
                      : ready
                        ? "Your results are connected. Bring them along as you explore the course."
                        : inProgress
                          ? "Your assessment is underway. Track responses in Field Kit; the course opens with your completed report."
                          : trail.prerequisite}
                  </p>
                  <div className="trail-guide-route-actions">
                    {isOwnerCoursePreview(params) ? (
                      <Link className="button secondary" href={courseHref}>
                        Preview {trail.name} Course (Owner)
                      </Link>
                    ) : null}
                    {ready ? (
                      <TrailResumeLink
                        href={courseHref}
                        progressKey={`dydd-course-${trail.courseSlug}`}
                        startLabel="Start the Course"
                        continueLabel="Continue the Course"
                      />
                    ) : (
                      <Link className="button primary" href={path(startHref)}>
                        {trail.id === "designpd"
                          ? designIdReady
                            ? "Explore DesignPD Expansion"
                            : "Complete DesignID First"
                          : inProgress
                            ? "Continue Assessment"
                            : mini &&
                                trail.id === "fruitlife-360" &&
                                !fruitPermit
                              ? "Unlock FruitLife360"
                              : `Take ${trail.name}`}
                      </Link>
                    )}
                    {complete ? (
                      <Link
                        className="button secondary"
                        href={`${fieldKit}#artifacts`}
                      >
                        View My Results
                      </Link>
                    ) : null}
                    {ready && inProgress ? (
                      <Link className="button secondary" href={path(startHref)}>
                        Track Current Assessment
                      </Link>
                    ) : null}
                  </div>
                </TrailPlacard>
              </article>
            );
          })}
        </div>
      </section>
      ))}
      {mini ? <FruitLifeMiniFooter /> : null}
    </main>
  );
}
