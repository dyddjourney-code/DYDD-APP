export default function TrailheadsLoading() {
  return (
    <main
      className="journey-shell hq-standalone-page"
      aria-busy="true"
      aria-label="Loading your trails"
    >
      <header className="standalone-hero">
        <div>
          <p className="eyebrow">Trailheads</p>
          <h1>Getting your trails ready.</h1>
          <p className="lede">
            Connecting your assessments, results, and next steps.
          </p>
        </div>
      </header>
      <div className="trail-loading-sign" aria-hidden="true">
        <div />
        <div />
        <div />
      </div>
    </main>
  );
}
