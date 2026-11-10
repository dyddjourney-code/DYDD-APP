import 'server-only';
import { Liquid } from 'liquidjs';
import { recoveryReport } from '@/lib/assessments/report-recovery';
import type { AssessmentSnapshotSummary } from '@/lib/assessments/student-context';
import { pdfScoreDisplayPayload } from '@/lib/pdfmonkey/score-display';
import designIdTemplate from '@/content/assessment-report-templates/designid.json';
import designPdTemplate from '@/content/assessment-report-templates/designpd.json';

// Pinned published provider source. Rendering never contacts a provider or writes a result.
const templates = [designIdTemplate, designPdTemplate];
const liquid = new Liquid({
  outputEscape: 'escape', strictFilters: true, ownPropertyOnly: true,
  // Missing historical optional fields intentionally follow the official defaults.
  strictVariables: false, parseLimit: 200000, renderLimit: 2000,
});
export const reportPreviewHeaders = {
  'Cache-Control': 'private, no-store, max-age=0',
  'Content-Type': 'text/html; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  // Only image transports present in the official source are permitted. No script,
  // font, frame, form, fetch, media, or unapproved host can send retained data.
  'Content-Security-Policy': "default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src https://images.squarespace-cdn.com https://quickchart.io https://api.qrserver.com; connect-src 'none'; font-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; sandbox",
};
const banner = '<aside aria-label="Sandbox report preview" style="position:relative;display:block;box-sizing:border-box;max-width:100%;padding:16px 24px;margin:0 0 20px;background:#fff4ce;color:#332800;border:2px solid #735c00;font:16px/1.5 system-ui,sans-serif;z-index:2147483647"><strong>Sandbox preview — full source report HTML</strong><br>This is the full current report template rendered from your saved assessment. It is not a provider-generated PDF. No PDF generation, email, or delivery has occurred from opening this preview.</aside>';

export async function renderSavedReportPreview(snapshot: AssessmentSnapshotSummary): Promise<string | null> {
  if (!['designid', 'designpd'].includes(snapshot.assessment_type)) return null;
  const report = recoveryReport(snapshot);
  if (!report) return null;
  const source = templates.find(template => template.id === report.templateId);
  // An overridden template must have its exact source retained before previewing it.
  if (!source) return null;
  const payload = pdfScoreDisplayPayload(report.templateId, report.payload);
  const body: string = await liquid.parseAndRender(source.body, payload);
  const css: string = source.css ? await liquid.parseAndRender(source.css, payload) : '';
  if (/\{[{%]/.test(body + css)) throw new Error('Unresolved report template markup.');
  const style = css ? `<style>${css}</style>` : '';
  if (/<body\b[^>]*>/i.test(body)) {
    return body.replace(/<\/head\s*>/i, `${style}<meta name="viewport" content="width=device-width, initial-scale=1"></head>`)
      .replace(/<body\b[^>]*>/i, match => `${match}${banner}`);
  }
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Sandbox saved report preview</title>${style}</head><body>${banner}${body}</body></html>`;
}
