// Isolated server-page and browser verification. No Supabase, email, or PDF calls.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const load = require('../scripts/fruitlife-test-load.cjs');
let status = null;
let reads = 0;
let refresh = false;
const mocks = {
  'next/link': ({ children, prefetch, ...props }) => React.createElement('a', props, children),
  '../actions': {
    getFruitLifeSessionStatus: async () => { reads++; return status; },
    sendFruitLifeReminder: () => { throw Error('No sends allowed'); },
    rescindFruitLifeObserverInvite: () => { throw Error('No writes allowed'); },
  },
  '../clear-submitted-draft': { ClearSubmittedFruitLifeDraft: () => null },
  '../session-auto-refresh': { FruitLifeSessionAutoRefresh: ({ enabled }) => { refresh = enabled; return null; } },
  '@/lib/fruitlife360/dashboard': { fruitLifeVisibleInvites: ({ invites }) => invites },
};
const thanks = load('app/fruitlife360/thanks/page.tsx', mocks).default;
const tracker = load('app/fruitlife360/status/page.tsx', mocks).default;
const fixture = (overrides = {}) => ({
  artifacts: [], invites: [], responses: [], token: 'synthetic-self-token', canManage: false,
  session: {
    id: 'synthetic-session', participant_name: 'Fixture', participant_email: 'fixture@example.invalid',
    self_completed_at: '2026-10-28T12:00:00Z', observer_completed_count: 0, observer_goal: 0,
    report_status: 'queued', session_status: 'ready_for_report', metadata: {},
    created_at: '2026-10-28T12:00:00Z', updated_at: '2026-10-28T12:00:00Z', ...overrides,
  },
});
const params = { session: 'synthetic-session', token: 'synthetic-self-token', type: 'self' };
const render = async (page, searchParams = params) => renderToStaticMarkup(await page({ searchParams: Promise.resolve(searchParams) }));
const readyPdf = { artifact_type: 'pdf', artifact_status: 'ready', external_url: 'https://example.invalid/private-report', created_at: '2026-10-28T12:00:00Z', provider: 'fixture' };
const proof = [];

(async () => {
  const pages = {};
  for (const mode of ['self-processing', 'waiting-observers', 'processing-360', 'ready-self', 'ready-360', 'payload-only', 'failed', 'stale-ready', 'unsubmitted']) {
    status = fixture();
    if (['waiting-observers', 'processing-360', 'ready-360', 'stale-ready'].includes(mode)) Object.assign(status.session, { observer_goal: 2, observer_completed_count: mode === 'waiting-observers' || mode === 'stale-ready' ? 1 : 2 });
    if (mode.startsWith('ready-') || mode === 'stale-ready') {
      status.artifacts = [readyPdf];
      status.session.report_status = 'ready';
      status.session.session_status = 'report_ready';
    }
    if (mode === 'payload-only') status.artifacts = [{ ...readyPdf, artifact_type: 'payload' }];
    if (mode === 'failed') status.session.report_status = 'error';
    if (mode === 'unsubmitted') status.session.self_completed_at = null;
    const ready = mode.startsWith('ready-');
    for (const [name, page] of [['thanks', thanks], ['status', tracker]]) {
      const html = await render(page);
      assert(html.includes('href="/courses/fruitlife-360-formation">Take the course'));
      assert(html.includes('href="/field-kit#collection-fruitlife-360"'));
      assert.equal(html.includes('>Open report</a>'), ready, `${mode}/${name} report gating`);
      assert.equal(refresh, !ready && (name === 'status' || mode !== 'unsubmitted'), `${mode}/${name} refresh`);
      if (ready) assert(html.includes('href="/fruitlife360/report?session=synthetic-session" target="_blank" rel="noopener noreferrer"'));
      if (mode === 'waiting-observers' || mode === 'stale-ready') assert(html.includes('1 of 2 observer reflections are complete'));
      if (mode === 'failed') assert(html.includes('report is not available yet'));
      assert(!html.includes('emailed to you'));
      pages[`${mode}-${name}`] = html;
    }
    proof.push({ mode, ready });
  }
  status = null;
  for (const searchParams of [{}, params]) {
    const html = await render(thanks, searchParams);
    assert(html.includes('Take the course'));
    assert(!html.includes('>Open report</a>'));
    assert(!html.includes('View session progress'));
  }
  const readsBefore = reads;
  const observerHtml = await render(thanks, { ...params, type: 'observer' });
  assert.equal(reads, readsBefore, 'observer must not query participant status');
  for (const secret of ['Take the course', 'Open report', 'View session progress', 'fixture@example.invalid', 'synthetic-self-token']) assert(!observerHtml.includes(secret));
  assert(observerHtml.includes('You can close this page'));

  const { default: puppeteer } = await import('puppeteer-core');
  const { default: chromium } = await import('@sparticuz/chromium');
  const css = fs.readFileSync('app/globals.css', 'utf8');
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'text/html');
    if (req.url.startsWith('/fruitlife360/report')) return res.end('<h1>Synthetic owned report</h1>');
    if (req.url.startsWith('/courses/fruitlife-360-formation')) return res.end('<h1>Synthetic course destination</h1>');
    if (req.url.startsWith('/brand/')) { res.setHeader('Content-Type', 'image/jpeg'); return res.end(fs.readFileSync('public/brand/tools/fruitful-life-360-logo.jpg')); }
    res.end(`<html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style></head><body>${pages[req.url.slice(1)] ?? observerHtml}</body></html>`);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  const browserChecks = [];
  try {
    browser = await puppeteer.launch({ args: chromium.args.filter(x => x !== '--single-process'), executablePath: await chromium.executablePath(), headless: true });
    const page = await browser.newPage();
    for (const width of [1280, 390, 320]) {
      await page.setViewport({ width, height: 900 });
      for (const route of ['ready-self-thanks', 'waiting-observers-thanks', 'processing-360-thanks', 'ready-360-status']) {
        await page.goto(`${base}/${route}`, { waitUntil: 'networkidle0' });
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width}/${route} overflow`);
        const course = await page.$('a[href="/courses/fruitlife-360-formation"]');
        assert(course);
        const rect = await course.boundingBox();
        assert(rect && rect.width > 0 && rect.height > 0 && rect.y >= 0 && rect.y + rect.height <= 900, `${width}/${route} course action in first viewport`);
        browserChecks.push({ width, route, noOverflow: true, courseActionVisible: true });
      }
    }
    await page.goto(`${base}/ready-self-thanks`, { waitUntil: 'domcontentloaded' });
    const before = page.url();
    const popup = browser.waitForTarget(target => target.url() === `${base}/fruitlife360/report?session=synthetic-session`);
    await page.click('a[target="_blank"]');
    await popup;
    assert.equal(page.url(), before);
    await page.click('a[href="/courses/fruitlife-360-formation"]');
    await page.waitForFunction(() => location.pathname === '/courses/fruitlife-360-formation');
    const output = { states: proof, browserChecks, reportPopupPreservesCompletion: true, courseDestination: true, noSend: true, scope: 'Actual server pages with synthetic status; local browser only. No live assessment, PDF, mail, auth, or database writes.' };
    fs.mkdirSync('tmp/fruitlife-completion', { recursive: true });
    fs.writeFileSync('tmp/fruitlife-completion/proof.json', JSON.stringify(output, null, 2));
    console.log('PASS 9 states × thanks/status; missing/invalid status; observer privacy; 12 desktop/mobile layout checks; real report popup and course navigation. No sends or database writes.');
  } finally {
    await browser?.close();
    server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
