import type { CSSProperties } from "react";
import { appliedCapacityImage, capacityBands, capacityCategory, capacityMinutes, capacityReflections, formatCapacityMinutes, type AppliedCapacityScores } from "@/lib/journey/applied-capacity";

export function JourneyAppliedCapacity({ scores }: { scores: AppliedCapacityScores }) {
  const missing = capacityReflections.filter(reflection => scores[reflection.name] == null);
  return <div className="journey-applied-capacity" aria-label="Applied Capacity teaching">
    <div className="capacity-introduction">
      <div><p>Capacity is grace given to us in specific areas. What comes easily, joyfully, and fruitfully? What creates anxiety, strain, or fatigue?</p>
      <p>Capacity is also what you have energy for, and when you run out. It helps you understand where grace flows naturally, where it stretches you, and where God may be inviting you into rest, boundaries, or partnership.</p></div>
      <figure className="capacity-bulbs"><img src={appliedCapacityImage} alt="An intact light bulb with the DesignID symbol on the left; a shattered light bulb on the right." /><figcaption>What you have energy for, and when you run out.</figcaption></figure>
    </div>
    <section className="capacity-scale" aria-label="Capacity categories, ascending from Drained to Abundant">
      <h3>Capacity and grace</h3>
      <ol className="capacity-staircase">{capacityBands.map((band, index) => <li key={band.name} style={{ "--step": index } as CSSProperties}><h4>{band.name} <span>({band.range})</span></h4><p>{band.phrase}</p></li>)}</ol>
    </section>
    <section className="capacity-time-model"><h3>What if you could use your DesignID scores to better manage your time?</h3>
      <p>A simple formula offers a lens for understanding how you use your time. It centers on capacity: what you have energy for, and when you run out.</p>
      <p>We start with the rule of eights: 8 hours of sleep, 8 hours of work, and 8 hours for the rest of life. That is an ideal, and many of you may never have experienced that balance. Feel free to adapt the model to your circumstances.</p>
      <p>You may discover that you spend much more time on activities outside your DesignID capacity. These estimates do not measure your capability or set hard limits. They can help you notice when you lose interest, become fatigued, or find yourself pushing through—and when your work feels fulfilling.</p>
      <p className="capacity-formula">16 hours × your reflection’s raw score ÷ 100</p>
    </section>
    <section className="capacity-personal" aria-label="Your estimated daily capacity"><h3>Your estimated daily capacity</h3>
      <p>These estimates cover 16 waking hours across work and home. Each is rounded to the nearest 15 minutes, so the displayed times may not add up to exactly 16 hours.</p>
      {missing.length ? <p role="status">{missing.length === 4 ? "Your saved DesignID scores are not available here yet." : "Some scores are missing from your saved DesignID report."} Missing or invalid scores are shown as unavailable, not as zero.</p> : null}
      <div className="capacity-personal-grid">{capacityReflections.map(reflection => {
        const score = scores[reflection.name] ?? null;
        return <section data-capacity-reflection={reflection.name} key={reflection.name} style={{ "--reflection-color": reflection.color, "--reflection-tint": reflection.tint } as CSSProperties}>
          <h4>{reflection.name}</h4>{score === null ? <p className="capacity-unavailable">Score, category, and time unavailable in your saved report.</p> : <><p className="capacity-category">{capacityCategory(score)}</p><p className="capacity-time">{formatCapacityMinutes(capacityMinutes(score))}</p></>}
        </section>;
      })}</div>
    </section>
    <section><h3>So, what can you do with this?</h3>
      <p>Remember, these estimates represent 16 hours of your day: your work and home time together. If you use up all your Shepherd energy at work, you may find it harder to draw on that energy at home.</p>
      <p>For an 8-hour workday, divide each unrounded daily estimate by 2, then round to the nearest 15 minutes if you want to display it. Equivalently, use 8 hours × your reflection’s raw score ÷ 100. Think about what this lens reveals about your workday, without treating it as a rigid schedule.</p>
    </section>
    <section className="capacity-calendar" aria-label="Enrichment activity: Your Calendar"><h3>Enrichment activity: Your Calendar</h3>
      <p>Select one normal workweek and color-code its activities using the DesignID reflection colors. Make your best guess about which reflection fits each activity. Here is a simple approach:</p>
      <dl className="capacity-calendar-key">{capacityReflections.map(reflection => <div key={reflection.name} style={{ borderLeftColor: reflection.color }}><dt>{reflection.name}</dt><dd>{reflection.activities}</dd></div>)}</dl>
      <p>Add up the time spent in each reflection’s activities and compare like periods: one day’s work activities with the 8-hour workday model, or a workweek with the unrounded workday estimate multiplied by your actual number of workdays. If you include home activities too, compare one whole day with the 16-hour model.</p>
      <p>You might learn more about why Thursdays feel tiring—or where your week leaves you feeling fulfilled.</p>
    </section>
  </div>;
}
