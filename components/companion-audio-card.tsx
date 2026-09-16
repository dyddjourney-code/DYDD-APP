import type { CompanionMoment } from "@/lib/courses/companion-moments";

type CompanionAudioCardProps = {
  moment?: CompanionMoment;
};

export function CompanionAudioCard({ moment }: CompanionAudioCardProps) {
  if (!moment) {
    return null;
  }

  return (
    <aside className="companion-audio-card" aria-label={`${moment.title} companion audio`}>
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
          <span>{moment.duration}</span>
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
    </aside>
  );
}
