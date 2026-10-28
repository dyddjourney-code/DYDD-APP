import type { StudentDesignContext } from "@/lib/assessments/student-context";

const missing = "Not available in your saved report.";
const escape = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
/** Rendering only: values come from the already authenticated, owner-scoped latest report. */
export function personalizeDesignIdAuthored(html: string, context: StudentDesignContext | null) {
  const report = context?.designId ?? {};
  const value = (key: string) => escape(report[key] || missing);
  const intro = (key: string) => escape((report[key] || missing).split(/\n\s*\n|\r?\n/)[0].trim());
  const reflections = ["Architect", "Artisan", "Shepherd", "Steward"];
  const rows = reflections.map(name => `<tr><th scope="row">${name}</th><td>${value(name.toLowerCase() + "Pts")}</td><td>${value(name.toLowerCase() + "Band")}</td></tr>`).join("");
  const snapshot = `<section class="designid-live-snapshot" aria-label="Your saved DesignID report"><table><caption>Your Design Snapshot</caption><thead><tr><th scope="col">Reflection</th><th scope="col">Score</th><th scope="col">Capacity</th></tr></thead><tbody>${rows}</tbody></table><h3>Primary Reflection: ${value("primary")}</h3><p data-report="primary-intro">${intro("primaryIntro")}</p><h3>Secondary Reflection: ${value("secondary")}</h3><p data-report="secondary-intro">${intro("secondaryIntro")}</p><h3>Integrative Reflection: ${value("integrativeReflection")}</h3><p data-report="integrative-expression">${value("integrativeExpression")}</p><h4>Spiritual Strength</h4><p data-report="spiritual-strength">${value("spiritualStrength")}</p><p><strong>Assessment Date:</strong> ${value("lastAssessmentDate")}</p></section>`;
  const capacity = `<section class="designid-live-capacity" aria-label="Your saved capacity scores"><h3>Your Capacity Score</h3><dl>${reflections.map(name => `<div><dt>${name}</dt><dd>${value(name.toLowerCase() + "Band")} — ${value(name.toLowerCase() + "Pts")}</dd></div>`).join("")}</dl></section>`;
  const integrated = `<section class="designid-live-integrated" aria-label="Your Integrated Reflection"><h3>Your Integrated Reflection</h3><p data-report="integrated-reflection">${value("integrativeReflection")}</p><p data-report="integrated-expression">${value("integrativeExpression")}</p></section>`;
  const shadow = `<section class="designid-shadow-results" aria-label="Your saved shadow reflections"><table class="designid-authored-table designid-shadow-table"><thead><tr><th scope="col">Risks</th><th scope="col">Root Cause</th><th scope="col">Redemption</th></tr></thead><tbody>${["A", "B", "C", "D"].map(letter => `<tr><td>${value("shadowRisk" + letter)}</td><td>${value("shadowRoot" + letter)}</td><td>${value("shadowRed" + letter)}</td></tr>`).join("")}</tbody></table></section>`;
  return html.replace("{{ authored.integrated_reflection }}", integrated).replace("{{ authored.shadow_matrix }}", shadow).replace("{{ authored.design_snapshot }}", snapshot).replace("{{ authored.capacity_scores }}", capacity);
}
