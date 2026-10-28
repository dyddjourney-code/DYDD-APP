import { displayDateTime, getLatestSnapshot, snapshotSection, type StudentAssessmentReport } from '@/lib/assessments/student-context';
const escape = (value: unknown) => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
/** Read-only saved Spiritual Gifts, from the same round-specific result selection as DesignID. */
export function journeySpiritualGiftsSnapshot(report: StudentAssessmentReport) {
  const snapshot = getLatestSnapshot(report, 'spiritual_gifts');
  if (!snapshot) return '<section class="journey-gifts-snapshot" aria-label="Your Spiritual Gifts Snapshot"><h3>Your Spiritual Gifts Snapshot</h3><p>No completed Spiritual Gifts result is connected to this reflection round. You can continue reflecting, or choose an available result in Your Journey Reflections. No assessment retake is required.</p></section>';
  const summary = snapshotSection(snapshot, 'summary');
  const payload = snapshot.scores.reportPayload && typeof snapshot.scores.reportPayload === 'object' && !Array.isArray(snapshot.scores.reportPayload) ? snapshot.scores.reportPayload as Record<string, unknown> : {};
  const rows = Array.isArray(snapshot.scores.topGifts) ? snapshot.scores.topGifts.slice(0, 5).flatMap(g => g && typeof g === 'object' && typeof g.label === 'string' ? [{name:g.label,score:g.score}] : []) : [];
  const gifts = rows.length ? rows : [1,2,3,4,5].flatMap(n => {
    const name = summary[`Top${n}_Name`] ?? payload[`Top${n}_Name`];
    return typeof name === 'string' && name ? [{name,score:summary[`Top${n}_Score`] ?? payload[`Top${n}_Score`]}] : [];
  });
  return `<section class="journey-gifts-snapshot" aria-label="Your Spiritual Gifts Snapshot"><h3>Your Spiritual Gifts Snapshot</h3><p>Spiritual Gifts assessment — ${escape(displayDateTime(snapshot.source_submitted_at ?? snapshot.created_at))}. Saved result for this reflection round.</p>${gifts.length ? `<ol>${gifts.map(g => `<li><strong>${escape(g.name)}</strong>${typeof g.score === 'number' && Number.isFinite(g.score) || typeof g.score === 'string' && g.score.trim() ? ` — ${escape(g.score)}` : ''}</li>`).join('')}</ol>` : '<p>Your saved report is connected; individual gift labels are not available in this result version.</p>'}<p><a href="/field-kit#collection-spiritual-gifts">Review your Spiritual Gifts report collection</a></p></section>`;
}
