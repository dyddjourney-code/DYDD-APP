import { buildDesignIdContext, getLatestSnapshot, type StudentAssessmentReport } from "@/lib/assessments/student-context";
import { personalizeDesignIdAuthored } from "@/lib/courses/designid-authored-personalization";

const escape = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const names = ["Architect", "Artisan", "Shepherd", "Steward"];
/** Read-only projection of the same authenticated saved report used by DesignID lessons. */
export function journeyDesignIdSnapshot(assessmentReport: StudentAssessmentReport) {
  const snapshot = getLatestSnapshot(assessmentReport, "designid");
  if (!snapshot) return '<section class="journey-designid-snapshot" aria-label="Your DesignID Snapshot"><h3>Your DesignID Snapshot</h3><p role="status">No saved DesignID report is connected here yet. Your personal results will appear here when your completed assessment is connected to this account.</p></section>';
  const payloadValue = snapshot.scores.reportPayload;
  const payload = payloadValue && typeof payloadValue === "object" && !Array.isArray(payloadValue) ? payloadValue as Record<string, unknown> : {};
  // Native/historical records can retain the complete report only in reportPayload.
  const savedSnapshot = {...snapshot, scores: {...payload, ...snapshot.scores}};
  const savedReport = {...assessmentReport, latest: assessmentReport.latest.map(row => row.id === snapshot.id ? savedSnapshot : row)};
  const report: Record<string, string> = buildDesignIdContext(savedReport);
  // The primary shadow label is not the separate integrative Potential_Shadow warning.
  report.reflectionShadow = [snapshot.scores.summary, snapshot.scores.profileLanguage, snapshot.scores.scores, payload, snapshot.scores]
    .map(section => section && typeof section === "object" && !Array.isArray(section) ? (section as Record<string, unknown>).Reflection_Shadow : "")
    .filter(value => typeof value === "string" && value.trim())[0] as string || "";
  const value = (key: string) => escape(report[key] || "Not available in your saved report.");
  const savedImage = String(payload?.Chart_Image || payload?.qc_donut || snapshot.scores.Chart_Image || "");
  const points = names.map(name => report[name.toLowerCase() + "Pts"]);
  const complete = points.every(p => p !== "" && Number.isFinite(Number(p)) && Number(p) >= 0) && points.some(p => Number(p) > 0);
  // Original PDF's Quick View doughnut: same order, palette, 58% cutout and white borders.
  // Whole saved points match the report's last-mile score-display repair; no rescoring.
  const chart = /^https:\/\//.test(savedImage) ? savedImage : complete ? "https://quickchart.io/chart?version=4&width=620&height=440&c=" + encodeURIComponent(JSON.stringify({type:"doughnut",data:{labels:names,datasets:[{data:points.map(Number),backgroundColor:["#D4A451","#647C9B","#739D5E","#5A496B"],borderColor:"#FFFFFF",borderWidth:2}]},options:{cutout:"58%",plugins:{legend:{position:"bottom",labels:{boxWidth:14,color:"#111"}},datalabels:{color:"#ffffff",font:{weight:"bold",size:14}}}}})) : "";
  const context = {assessmentReport: savedReport, designId:report, displayName:"", isSignedIn:true};
  let shadowRow = 0;
  const shadow = personalizeDesignIdAuthored("{{ authored.shadow_matrix }}", context)
    .replace('<thead><tr>', '<thead><tr><th scope="col" aria-label="Row"></th>')
    .replace(/<tr><td>/g, () => `<tr><th scope="row">${["A", "B", "C", "D"][shadowRow++]}</th><td>`);
  return `<section class="journey-designid-snapshot" aria-label="Your DesignID Snapshot"><h3>Your DesignID Snapshot</h3><dl class="journey-designid-labels">${[["Primary","primary"],["Secondary","secondary"],["Integrative","integrativeReflection"]].map(([label,key])=>`<div><dt>${label}</dt><dd>${value(key)}</dd></div>`).join("")}</dl><div class="journey-designid-score-layout"><section class="journey-designid-capacity"><h4>DesignID Capacity</h4><dl class="journey-designid-capacities" aria-label="Your reflection capacities">${names.map(name=>`<div><dt>${name}</dt><dd>${value(name.toLowerCase()+"Band")}</dd></div>`).join("")}</dl></section>${chart ? `<figure class="journey-designid-donut"><img src="${escape(chart)}" alt="Your saved DesignID reflection scores: ${escape(names.map((name,i)=>name+" "+(points[i]||"not available")).join(", "))}" /><figcaption>${names.map(name=>`${name}: <strong>${value(name.toLowerCase()+"Pts")}</strong>`).join(" · ")}</figcaption></figure>` : '<p role="status">The scored wheel is not available in your saved report.</p>'}</div><h3>Your shadow reflections</h3><p class="journey-shadow-scroll-hint">Scroll across the chart to read every column.</p><div class="journey-shadow-scroll" role="region" aria-label="Your shadow reflection chart" tabindex="0">${shadow}</div></section>`;
}
