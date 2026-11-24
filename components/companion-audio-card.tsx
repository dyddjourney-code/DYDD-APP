import type { CompanionMoment } from "@/lib/courses/companion-moments";

type CompanionAudioCardProps = {
  moment?: CompanionMoment;
  showDuration?: boolean;
  collapsible?: boolean;
};

export function CompanionAudioCard({ moment, showDuration = true, collapsible = false }: CompanionAudioCardProps) {
  if (!moment) {
    return null;
  }

  const content = (
    <>
      <div className="companion-audio-portraits" aria-hidden="true">
        {moment.speakers.map((speaker) => (
          <img
            key={speaker.name}
            src={speaker.image}
            alt=""
            className={moment.speakers.length > 1 ? "duo" : ""}
          />
        ))}
      </div>
      <div className="companion-audio-content">
        <p className="section-label">{moment.kicker}</p>
        <h3>{moment.title}</h3>
        <p className="companion-audio-speakers">
          {moment.speakers.map((speaker) => `${speaker.name}, ${speaker.role}`).join(" + ")}
          {showDuration ? <span>{moment.duration}</span> : null}
        </p>
        <audio controls preload="metadata" src={moment.audioSrc}>
          <a href={moment.audioSrc}>Play companion audio</a>
        </audio>
        <details className="companion-transcript">
          <summary>Read transcript</summary>
          <div>
            {moment.transcript.map((line, index) => (
              <p key={`${line.speaker ?? "line"}-${index}`}>
                {line.speaker ? <strong>{line.speaker}: </strong> : null}
                {line.text}
              </p>
            ))}
          </div>
        </details>
      </div>
    </>
  );
  return <aside className={`companion-audio-card${collapsible ? " companion-audio-inline" : ""}`} aria-label={`${moment.title} companion audio`}>{collapsible ? <details className="companion-listen"><summary><span>Listen with your companions</span><small>{moment.duration} · Audio & transcript</small></summary><div className="companion-listen-body">{content}</div></details> : content}</aside>;
}
