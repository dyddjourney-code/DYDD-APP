import {
  meetingLessons,
  planGoal,
  scheduledDates,
  type CirclePlan,
} from "./plan";
const esc = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
export function circlePlanHtml(p: CirclePlan) {
  const dates = scheduledDates(p);
  return `<!doctype html><html><head><meta charset="utf-8"><style>@page{size:Letter;margin:18mm}*{box-sizing:border-box}body{font:11pt Arial,sans-serif;color:#23372a;line-height:1.5}header{background:#233f2c;color:#fff;padding:24px;border-radius:10px}h1{font-size:25pt;margin:4px 0}h2{font-size:15pt;border-bottom:1px solid #cbd7c6;padding-bottom:6px;margin-top:26px}h3{font-size:12pt;margin-bottom:6px}.meta{display:grid;grid-template-columns:1fr 1fr;gap:6px 20px;margin:20px 0}.meeting{break-inside:avoid;border-bottom:1px solid #d9e1d5;padding:10px 0}small{color:#53634e}li{margin:3px 0}footer{font-size:9pt;color:#53634e;margin-top:30px}</style></head><body><header><small style="color:#d2e0c9">DISCOVER YOUR DIVINE DESIGN</small><h1>${esc(p.name)}</h1><div>Circle meeting plan</div></header><div class="meta"><div><b>Circle:</b> ${esc(p.format)} · ${esc(p.expectedPeople)} people including organizer</div><div><b>Meet:</b> ${esc(p.meetingMode)} · ${esc(p.meetingMinutes)} minutes</div><div><b>Time:</b> ${esc(p.time || "To be set")} · ${esc(p.timezone)}</div><div><b>Rhythm:</b> ${esc(p.rhythm === "Custom" ? `Every ${p.customDays} days` : p.rhythm)}</div><div><b>Location:</b> ${esc(p.location || "To be set")}</div><div><b>Finish:</b> ${esc(dates.at(-1) || "To be set")}</div></div><p><b>Completion goal:</b> ${esc(planGoal(p))}</p>${p.breaks.length ? `<h2>Breaks</h2><ul>${p.breaks.map((b) => `<li>${esc(b.start)}${b.end !== b.start ? " – " + esc(b.end) : ""}</li>`).join("")}</ul>` : ""}<h2>Meeting schedule</h2>${Array.from(
    { length: p.meetingCount },
    (_, i) =>
      `<section class="meeting"><h3>Meeting ${i + 1} · ${esc(dates[i] || "Date to be set")}</h3><ol>${meetingLessons(
        p,
        i + 1,
      )
        .map(
          (l) =>
            `<li>${esc(l.moduleTitle)} — ${esc(l.title)} <small>(${esc(l.duration)} teaching)</small></li>`,
        )
        .join(
          "",
        )}</ol>${meetingLessons(p, i + 1).length ? "" : "<p>Discussion, reflection, or catch-up.</p>"}</section>`,
  ).join(
    "",
  )}<h2>People</h2><p>Organizer + ${p.participants.length} listed. Listing a person does not send an invitation or grant access.</p><ul>${p.participants.map((person) => `<li>${esc(person.name)} — ${esc(person.email)}</li>`).join("")}</ul><footer>Personal CARE responses and reflections stay private. Lesson durations refer to teaching only; leave room for reflection, practice, and conversation.</footer></body></html>`;
}
