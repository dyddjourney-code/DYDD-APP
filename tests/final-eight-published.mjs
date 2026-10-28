// Synthetic signed-in acceptance only: no assessment action, PDF generation or email.
// Remote runs are deliberately gated until a parent confirms a new deployment:
// FINAL_EIGHT_DEPLOYMENT_READY=1 FINAL_EIGHT_ENV=production node tests/final-eight-published.mjs
// Local: FINAL_EIGHT_BASE=http://127.0.0.1:3000 FINAL_EIGHT_ENV=sandbox node ...
// Set FINAL_EIGHT_ARTIFACTS=0 when the coordinated artifact harness owns that check.
import load from '../scripts/fruitlife-test-load.cjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

const env = process.env.FINAL_EIGHT_ENV || process.env.COURSE_ENV || 'production';
assert(['production', 'sandbox'].includes(env));
const sandbox = env === 'sandbox';
const published = sandbox ? 'https://dydd-online-school-sandbox.vercel.app' : 'https://dydd-online-school.vercel.app';
const base = new URL(process.env.FINAL_EIGHT_BASE || process.env.COURSE_BASE || published).origin;
const local = ['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname);
assert(local || base === published, 'Use the expected published alias or a local server');
assert(local || process.env.FINAL_EIGHT_DEPLOYMENT_READY === '1', 'Not run: parent must confirm deployment ready with FINAL_EIGHT_DEPLOYMENT_READY=1');
const cfg = JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/' + (sandbox ? 'dydd-online-school-sandbox' : 'dydd-online-school-supabase') + '.json'));
const ref = sandbox ? 'atemrshtshxoqnuevvqu' : 'laojrzlqbkmirzcbcnyw';
assert.equal(new URL(cfg.project_url).hostname, ref + '.supabase.co');
const db = createClient(cfg.project_url, cfg.service_role_key, { auth: { persistSession: false } });
const check = r => { assert(!r.error, r.error?.message); return r.data; };
const out = 'tmp/final-eight';
fs.mkdirSync(out, { recursive: true });
const curriculum = load('lib/passport/curriculum.ts').passportCurriculum;
const designCourse = 'designpd-alignment', fruitCourse = 'fruitlife-360-formation';
const course = slug => { const c = curriculum.find(c => c.slug === slug); assert(c?.lessons.length); return c; };
const cases = [
  { slug: designCourse, origin: 'field-kit', card: '/field-kit#collection-designpd', entry: '/field-kit', section: '#collection-designpd' },
  { slug: fruitCourse, origin: 'field-kit', card: '/field-kit#collection-fruitlife-360', entry: '/field-kit', section: '#collection-fruitlife-360' },
  { slug: designCourse, origin: 'trailheads', card: '/trailheads#designpd', entry: '/trailheads', section: '#designpd' },
];
const checks = [], errors = [], screenshots = [], accounts = [], snapshots = [], sessions = [], cleanupErrors = [];
const reason = 'isolated_final_eight_qa';
let browser, page, participant, cookie = '', owner, designSnapshot, fruitSnapshot, storedPath, failure, cleaned = false;
const api = async (path, auth = cookie) => {
  const r = await fetch(base + path, { headers: { cookie: auth }, redirect: 'manual' });
  return { status: r.status, body: await r.json() };
};
async function account(label) {
  const email = 'final-eight-' + label + '-' + crypto.randomUUID() + '@example.invalid';
  const a = { email };
  accounts.push(a); // Register before the first mutation, even if creation fails.
  check(await db.from('dydd_email_suppressions').insert({ email, reason }));
  const password = crypto.randomBytes(30).toString('hex');
  a.uid = check(await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: 'Synthetic Final Eight QA' } })).user.id;
  let cookies = [];
  const client = createServerClient(cfg.project_url, cfg.anon_key, { cookies: { getAll: () => cookies, setAll: c => { cookies = c; } } });
  check(await client.auth.signInWithPassword({ email, password }));
  a.cookies = cookies;
  a.cookie = cookies.map(c => c.name + '=' + c.value).join('; ');
  return a;
}
async function snapshot(type, scores, source = 'final_eight_isolated_qa') {
  const id = check(await db.from('assessment_snapshots').insert({ user_id: owner.uid, participant_id: participant, assessment_type: type, source, source_response_id: 'qa-' + crypto.randomUUID(), source_submitted_at: new Date().toISOString(), scores }).select('id').single()).id;
  snapshots.push(id);
  return id;
}
async function go(path) {
  const response = await page.goto(base + path, { waitUntil: 'domcontentloaded', timeout: 60000 });
  assert(response?.ok(), 'Navigation failed: ' + path + ' status=' + response?.status());
  assert.notEqual(new URL(page.url()).pathname, '/login', 'Expected genuine signed-in page');
}
async function active(slug, lesson) {
  await page.waitForFunction(title => document.querySelector('.assessment-active-lesson h2')?.textContent === title, { timeout: 30000 }, course(slug).lessons.find(l => l.slug === lesson).title);
  await page.waitForSelector('.course-completion-controls > button:not([disabled])');
}
async function startReflection() {
  await page.waitForFunction(() => document.querySelector('.reflection-entry-setup button') || document.querySelector('.reflection-answer textarea:not([disabled])'));
  if (await page.$('.reflection-entry-setup button')) await page.$eval('.reflection-entry-setup button', e => e.click());
  await page.waitForSelector('.reflection-answer textarea:not([disabled])');
}
async function answer(text) {
  await page.$eval('.reflection-answer textarea', (e, value) => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(e, value);
    e.dispatchEvent(new Event('input', { bubbles: true }));
  }, text);
}
async function shot(name) {
  const path = `${out}/published-${env}-${name}.png`;
  await page.screenshot({ path, fullPage: true });
  screenshots.push(path);
}
async function noOverflow() {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Horizontal overflow at ' + page.viewport().width);
}
try {
  for (const origin of ['field-kit','trailheads']) {
    const target = `/courses/designpd-alignment?origin=${origin}&lesson=your-planning-tendency`;
    const response = await fetch(base + target, {redirect:'manual'});
    assert([302,303,307].includes(response.status));
    const login = new URL(response.headers.get('location'),base);
    assert.equal(login.pathname,'/login');
    assert.equal(login.searchParams.get('next'),target);
  }
  checks.push('Anonymous DesignPD deep links retain both course origins and validated lesson through normal sign-in');
  owner = await account('owner'); cookie = owner.cookie;
  participant = check(await db.from('assessment_participants').insert({ user_id: owner.uid, normalized_email: owner.email, display_name: 'Synthetic Final Eight QA' }).select('id').single()).id;
  await snapshot('designid', { summary: { Primary: 'Architect', Secondary: 'Artisan', Integrative_Reflection: 'Visionary' }, scores: { Architect_Pts: 40, Artisan_Pts: 30, Shepherd_Pts: 20, Steward_Pts: 10 } });
  designSnapshot = await snapshot('designpd', { summary: { Plan_Tendency: 'Balanced', Decide_Tendency: 'Think It', Do_Tendency: 'Together' }, scores: { Plan_Score: 50, Decide_Score: 75, Do_Score: 80 }, pdfMonkey: { status: 'ready' }, resultEmail: { sent: false, reason: 'owner_review_without_email' } });
  const now = new Date().toISOString();
  fruitSnapshot = await snapshot('fruit_360', { summary: { Report_Mode: 'SELF_ONLY', Report_Date: now, Reviewer_Mix: 'Self only', Most_Visible_Fruit_List: 'Love', Steady_Forming_Fruit_List: 'Joy', Growth_Invitation_Fruit_List: 'Patience' }, scores: { Response_Count: 1, Observer_Count: 0 } }, 'fruitlife_360_native_app');
  sessions.push(check(await db.from('fruitlife_360_sessions').insert({ participant_id: participant, created_by_user_id: owner.uid, participant_email: owner.email, participant_name: 'Synthetic Final Eight QA', session_status: 'report_ready', report_status: 'ready', report_mode: null, report_snapshot_id: fruitSnapshot, observer_goal: 0, observer_completed_count: 0, response_count: 1, self_completed_at: now }).select('id').single()).id);
  for (const slug of [designCourse, fruitCourse]) {
    check(await db.from('passport_lesson_completions').insert(course(slug).lessons.slice(0, -1).map(l => ({ user_id: owner.uid, course_slug: slug, lesson_slug: l.slug }))));
    const context = await api('/api/course-reflections?courseSlug=' + slug);
    assert.equal(context.status, 200); assert.equal(context.body.canStart, true);
    assert.equal(context.body.reports[0].id, slug === designCourse ? designSnapshot : fruitSnapshot);
  }
  const beforeCompletion = await api('/api/course-progress?courseSlug=' + fruitCourse);
  assert(beforeCompletion.body.awards.includes('fruit_360'), 'Assessment completion recognized before course completion');
  assert.equal(beforeCompletion.body.complete, false, 'Assessment badge never auto-completes course');
  checks.push('Suppression precedes auth creation; owned DesignID/DesignPD and native null-mode SELF_ONLY fixtures; all prerequisite lessons completed');
  browser = await puppeteer.launch({ args: chromium.args.filter(x => x !== '--single-process'), executablePath: await chromium.executablePath(), headless: true });
  page = await browser.newPage(); page.setDefaultTimeout(30000);
  page.on('pageerror', e => errors.push(e.message));
  await page.setCookie(...owner.cookies.map(c => ({ name: c.name, value: c.value, domain: new URL(base).hostname, path: '/' })));
  // Only course reflection/checklist writes are allowed through the browser.
  await page.setRequestInterception(true);
  page.on('request', r => {
    const u = new URL(r.url());
    if (u.origin === base && !['GET', 'HEAD', 'OPTIONS'].includes(r.method()) && !['/api/course-reflections', '/api/course-progress'].includes(u.pathname)) {
      errors.push('Blocked unintended mutation: ' + r.method() + ' ' + u.pathname);
      return r.abort();
    }
    return r.continue();
  });
  await go('/hq#passport'); await page.waitForSelector('.passport-badge-button');
  const initialBadge = await page.$$eval('.passport-badge-button',es=>es.map(e=>({title:e.querySelector('strong')?.textContent,earned:e.classList.contains('earned')})));
  assert(initialBadge.find(b=>b.title==='FruitLife360')?.earned);
  assert.equal(initialBadge.find(b=>b.title==='FruitLife360 Course')?.earned,false);
  checks.push('Actual Passport UI shows owned assessment earned before course completion; course badge independent');
  for (const width of [1280, 390, 320]) {
    await page.setViewport({ width, height: 1000 });
    for (const c of cases) {
      const final = course(c.slug).lessons.at(-1);
      // Clear only this synthetic final lesson so every width exercises a real write.
      check(await db.from('passport_lesson_completions').delete().eq('user_id', owner.uid).eq('course_slug', c.slug).eq('lesson_slug', final.slug));
      await go(c.entry);
      await page.waitForSelector(c.section);
      const links = await page.$$eval(c.section + ' a', es => es.map(e => e.getAttribute('href')));
      const entry = links.find(h => h && h.split('?')[0] === '/courses/' + c.slug);
      assert(entry, 'Missing genuine card course action: ' + c.section);
      assert.equal(new URL(entry, base).searchParams.get('origin'), c.origin);
      await go(entry);
      assert.equal(new URL(page.url()).searchParams.get('origin'), c.origin);
      assert.equal(await page.$eval('.course-nav a', e => e.getAttribute('href')), c.card);
      await page.reload({ waitUntil: 'domcontentloaded' });
      assert.equal(new URL(page.url()).searchParams.get('origin'), c.origin);
      assert.equal(await page.$eval('.course-nav a', e => e.getAttribute('href')), c.card);
      await go(`/learn/${c.slug}/${final.slug}?origin=${c.origin}`);
      const canonical = new URL(page.url());
      assert.equal(canonical.pathname, '/courses/' + c.slug); assert.equal(canonical.searchParams.get('origin'), c.origin); assert.equal(canonical.searchParams.get('lesson'), final.slug);
      await active(c.slug, final.slug); await startReflection();
      const text = `Synthetic final-eight ${env} ${width} ${c.slug} ${c.origin}`;
      await answer(text);
      await page.$eval('.course-completion-controls > button', e => e.click());
      await page.waitForSelector('.course-completion-controls [role=status] a');
      assert.equal(await page.$eval('.course-completion-controls [role=status] a', e => e.getAttribute('href')), c.card);
      let saved = await api('/api/course-reflections?courseSlug=' + c.slug);
      assert(saved.body.entries.some(e => e.question_id === final.slug && e.response === text), 'Final reflection persisted');
      assert.equal(saved.body.rounds[0].assessment_snapshot_id, c.slug === designCourse ? designSnapshot : fruitSnapshot);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await active(c.slug, final.slug); await page.waitForSelector('.reflection-answer textarea:not([disabled])');
      assert.equal(await page.$eval('.reflection-answer textarea', e => e.value), text);
      assert(await page.$eval('.course-completion-controls input', e => e.checked));
      assert.equal(await page.$eval('.course-completion-controls [role=status] a', e => e.getAttribute('href')), c.card);
      const progress = await api('/api/course-progress?courseSlug=' + c.slug);
      assert.equal(progress.status, 200); assert.equal(progress.body.complete, true); assert(progress.body.completed.includes(final.slug));
      if (c.slug === fruitCourse) assert(progress.body.awards.includes('fruit_360'), 'Owned completed SELF_ONLY report earns assessment completion, independent of course');
      await noOverflow(); await shot(`${width}-${c.slug}-${c.origin}-final`);
      // Exercise the final Continue link and anchored destination, not only its markup.
      await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded' }), page.$eval('.course-completion-controls [role=status] a', e => e.click())]);
      assert.equal(new URL(page.url()).pathname + new URL(page.url()).hash, c.card);
      await page.waitForSelector(c.section);
      await page.waitForFunction(selector => { const r=document.querySelector(selector)?.getBoundingClientRect(); return Boolean(r && scrollY>100 && r.top<innerHeight*.7 && r.bottom>0); }, {timeout:10000}, c.section);
      const anchorShot = `${out}/published-${env}-${width}-${c.slug}-${c.origin}-card.png`;
      await page.screenshot({path:anchorShot}); screenshots.push(anchorShot);
      checks.push({ width, course: c.slug, origin: c.origin, actualCardEntry: entry, backAndContinue: c.card, reloadAndCanonicalOrigin: true, reflectionSaveReload: true, finalCompletionPersisted: true, noOverflow: true });
    }
    for (const [lesson, labels] of [
      ['what-you-see', ['Balanced', 'Think It', 'Together']],
      ['your-planning-tendency', ['Balanced']],
      ['your-deciding-tendency', ['Think It']],
      ['your-doing-tendency', ['Together']],
    ]) {
      await go(`/courses/${designCourse}?lesson=${lesson}&origin=field-kit`); await active(designCourse, lesson);
      await page.waitForSelector('.designpd-lesson-tendencies');
      const panel = await page.$eval('.designpd-lesson-tendencies', e => e.textContent);
      for (const label of labels) assert(panel.includes(label), `${lesson} missing saved ${label}: ${panel}`);
      const pairs = await page.$$eval('.designpd-lesson-tendencies dl > div', es => es.map(e => [e.querySelector('dt')?.textContent, e.querySelector('dd')?.textContent]));
      const expectedPairs = { 'what-you-see': [['Plan', 'Balanced'], ['Decide', 'Think It'], ['Do', 'Together']], 'your-planning-tendency': [['Plan', 'Balanced']], 'your-deciding-tendency': [['Decide', 'Think It']], 'your-doing-tendency': [['Do', 'Together']] };
      assert.deepEqual(pairs, expectedPairs[lesson], 'Each saved tendency must match its actual axis');
      if (lesson === 'what-you-see') {
        await startReflection(); const text = `Synthetic module-two saved tendencies ${width}`; await answer(text);
        await page.$eval('.course-completion-controls > button', e => e.click());
        await page.waitForFunction(() => document.querySelector('.assessment-active-lesson h2')?.textContent !== 'What You See');
        await go(`/courses/${designCourse}?lesson=${lesson}&origin=field-kit`); await active(designCourse, lesson);
        await page.waitForSelector('.reflection-answer textarea:not([disabled])');
        assert.equal(await page.$eval('.reflection-answer textarea', e => e.value), text);
        assert((await api('/api/course-reflections?courseSlug=' + designCourse)).body.entries.some(e => e.question_id === lesson && e.response === text));
      }
      await noOverflow(); await shot(`${width}-designpd-${lesson}`);
      checks.push({ width, lesson, savedTendencies: labels, scopedPanel: true, reflectionSaveReload: lesson === 'what-you-see' });
    }
    await go('/designpd?origin=field-kit');
    assert.equal(await page.$eval('input[name=origin]',e=>e.value),'field-kit');
    assert.equal(await page.$eval('form .course-nav a',e=>e.getAttribute('href')),'/field-kit#collection-designpd');
    await go('/hq#passport'); await page.waitForSelector('.passport-badge-button');
    const earned = await page.$$eval('.passport-badge-button.earned strong',es=>es.map(e=>e.textContent));
    assert(earned.includes('FruitLife360')); assert(earned.includes('FruitLife360 Course'));
    checks.push({width,actualAssessmentAndExistingCourseBadgesEarned:true,designPdFormOriginAndBack:true});
    await go(`/designpd/thanks?snapshot=${designSnapshot}&origin=field-kit`);
    await page.waitForSelector('main h1');
    const thanks = await page.$eval('main', e => ({ text: e.textContent, links: [...e.querySelectorAll('a')].map(a => a.getAttribute('href')) }));
    assert(thanks.text.includes('Your DesignPD report is ready.'), 'Owned ready snapshot must not render pending/generic status');
    assert(thanks.text.includes('No email was sent for this owner review.'), 'Synthetic owned review must not claim email delivery');
    assert(thanks.links.includes('/field-kit#collection-designpd')); assert(!thanks.links.some(h => h?.startsWith('/journey')), 'No unrelated Journey action on DesignPD completion');
    const report = thanks.links.find(h => h?.startsWith('/designpd/report?'));
    assert(report); assert.equal(new URL(report, base).searchParams.get('snapshot'), designSnapshot);
    const continuation = thanks.links.find(h => h?.startsWith('/courses/' + designCourse));
    assert(continuation); assert.equal(new URL(continuation, base).searchParams.get('origin'), 'field-kit');
    await noOverflow(); await shot(`${width}-designpd-thanks`);
    checks.push({ width, ownedDesignPdThanks: true, ownedReadyStateAndExactSnapshotReport: true, anchoredBack: true, noUnrelatedJourney: true });
  }
  if (process.env.FINAL_EIGHT_ARTIFACTS !== '0') {
    const bucket = 'assessment-report-pdfs';
    const info = check(await db.storage.getBucket(bucket)); assert.equal(info.public, false, 'Synthetic PDF must remain private');
    // A tiny valid fixture PDF, uploaded directly; never invoke any report provider.
    const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 150] /Resources << >> /Contents 4 0 R >>', '<< /Length 0 >>\nstream\n\nendstream'];
    let pdf = '%PDF-1.4\n', offsets = [0];
    for (let i = 0; i < objects.length; i++) { offsets.push(Buffer.byteLength(pdf)); pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`; }
    const xref = Buffer.byteLength(pdf); pdf += 'xref\n0 5\n0000000000 65535 f \n' + offsets.slice(1).map(n => String(n).padStart(10, '0') + ' 00000 n \n').join('') + `trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
    storedPath = `designpd/${designSnapshot}/report.pdf`;
    check(await db.storage.from(bucket).upload(storedPath, Buffer.from(pdf), { contentType: 'application/pdf', upsert: false }));
    const row = check(await db.from('assessment_snapshots').select('scores').eq('id', designSnapshot).single());
    check(await db.from('assessment_snapshots').update({ scores: { ...row.scores, reportArtifact: { bucket, path: storedPath, filename: 'Synthetic final-eight fixture.pdf', archivedAt: new Date().toISOString(), bytes: Buffer.byteLength(pdf) } } }).eq('id', designSnapshot));
    const path = `/api/artifacts/${designSnapshot}/download?download=1`;
    const anon = await fetch(base + path, { redirect: 'manual' }); assert([302, 303, 307].includes(anon.status));
    const login = new URL(anon.headers.get('location'), base); assert.equal(login.pathname, '/login'); assert.equal(login.searchParams.get('next'), path);
    const stranger = await account('nonowner');
    assert.equal((await fetch(base + path, { headers: { cookie: stranger.cookie }, redirect: 'manual' })).status, 404);
    const resolved = await fetch(base + path, { headers: { cookie }, redirect: 'manual' }); assert([302, 303, 307].includes(resolved.status));
    const signed = new URL(resolved.headers.get('location')); assert.equal(signed.origin, new URL(cfg.project_url).origin); assert(signed.pathname.includes('/storage/v1/object/sign/' + bucket + '/')); assert(signed.searchParams.has('token'));
    const bytes = await fetch(signed); assert.equal(bytes.status, 200); assert.equal(Buffer.from(await bytes.arrayBuffer()).toString(), pdf);
    const publicRead = await fetch(cfg.project_url + '/storage/v1/object/public/' + bucket + '/' + storedPath); assert(!publicRead.ok);
    checks.push('Synthetic private PDF: anonymous login resumes exact artifact; nonowner 404; owner resolver yields usable signed private URL; public read rejected; no provider generation');
  } else checks.push('Artifact resolver checks explicitly delegated via FINAL_EIGHT_ARTIFACTS=0');
  assert.deepEqual(errors, []);
} catch (e) { failure = e; }
finally {
  async function cleanup(label, fn) { try { await fn(); } catch (e) { cleanupErrors.push(label + ': ' + e.message); } }
  await cleanup('browser', async () => { await browser?.close(); });
  if (storedPath) await cleanup('private PDF', async () => { check(await db.storage.from('assessment-report-pdfs').remove([storedPath])); });
  if (sessions.length) await cleanup('native sessions', async () => { check(await db.from('fruitlife_360_sessions').delete().in('id', sessions)); });
  if (snapshots.length) await cleanup('snapshots', async () => { check(await db.from('assessment_snapshots').delete().in('id', snapshots)); });
  if (participant) await cleanup('participant', async () => { check(await db.from('assessment_participants').delete().eq('id', participant)); });
  for (const a of accounts) {
    if (a.uid) await cleanup('auth and cascades', async () => {
      check(await db.auth.admin.deleteUser(a.uid));
      for (const table of ['reflection_rounds', 'reflection_entries', 'passport_lesson_completions', 'passport_awards', 'assessment_snapshots']) {
        const remaining = await db.from(table).select('user_id', { count: 'exact', head: true }).eq('user_id', a.uid); check(remaining); assert.equal(remaining.count, 0, table + ' cleanup');
      }
    });
    await cleanup('zero provider intents ' + a.email, async () => {
      const messages = await db.from('dydd_email_messages').select('id', { count: 'exact', head: true }).eq('recipient', a.email); check(messages); assert.equal(messages.count, 0, 'No provider message intent for synthetic learner');
    });
    await cleanup('lifecycle fixtures ' + a.email, async () => {
      for (const table of ['dydd_lifecycle_jobs', 'dydd_lifecycle_events']) { check(await db.from(table).delete().eq('email', a.email)); const remaining = await db.from(table).select('id', { count: 'exact', head: true }).eq('email', a.email); check(remaining); assert.equal(remaining.count, 0, table + ' cleanup'); }
    });
    await cleanup('suppression ' + a.email, async () => { check(await db.from('dydd_email_suppressions').delete().eq('email', a.email).eq('reason', reason)); });
  }
  cleaned = cleanupErrors.length === 0;
  fs.writeFileSync(`${out}/published-${env}.json`, JSON.stringify({ env, base, database: ref, at: new Date().toISOString(), passed: !failure && cleaned, checks, screenshots, errors, failure: failure?.stack, cleanupErrors, cleaned, syntheticOnly: true, fixtureEmailSuppressedBeforeCreate: true, zeroProviderIntents: !cleanupErrors.some(e => e.startsWith('zero provider intents')), realAssessmentSubmission: false, pdfGenerated: false, emailSent: false, artifactsDelegated: process.env.FINAL_EIGHT_ARTIFACTS === '0' }, null, 2));
}
if (failure) throw failure;
assert.deepEqual(cleanupErrors, [], 'Synthetic fixture cleanup must finish');
console.log(`PASS final-eight ${env}: ${checks.length} checks; fixtures removed; zero provider intents`);
