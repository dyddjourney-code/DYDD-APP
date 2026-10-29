// Synthetic sessions only. No emails, assessment submissions or customer edits.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
const sandbox = process.env.ENTRY_QA_ENV === 'sandbox';
const base = process.env.ENTRY_QA_BASE || (sandbox ? 'http://localhost:3152' : 'http://localhost:3151');
assert([sandbox ? 'http://localhost:3152' : 'http://localhost:3151', sandbox ? 'https://dydd-online-school-sandbox.vercel.app' : 'https://dydd-online-school.vercel.app'].includes(base));
const cfg = JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/' + (sandbox ? 'dydd-online-school-sandbox' : 'dydd-online-school-supabase') + '.json'));
assert.equal(new URL(cfg.project_url).hostname.split('.')[0], sandbox ? 'atemrshtshxoqnuevvqu' : 'laojrzlqbkmirzcbcnyw');
const admin = createClient(cfg.project_url, cfg.service_role_key, { auth: { persistSession: false } });
const out = { base, sandbox, checks: [], screenshots: [], errors: [] };
let browser, id;
function pass(s) { out.checks.push(s); console.log('PASS ' + s); }
try {
  browser = await puppeteer.launch({ args: chromium.args.filter(x => x !== '--single-process'), executablePath: await chromium.executablePath(), headless: true });
  const context = await browser.createBrowserContext(), page = await context.newPage();
  page.on('pageerror', e => out.errors.push(e.message));
  await page.setRequestInterception(true);
  page.on('request', r => ['GET', 'HEAD', 'OPTIONS'].includes(r.method()) ? r.continue() : r.abort());
  for (const width of [1280, 390, 320]) {
    await page.setViewport({ width, height: 950 });
    await page.goto(base, { waitUntil: 'networkidle2', timeout: 90000 });
    assert.equal(new URL(page.url()).pathname, '/');
    const text = await page.$eval('main', e => e.textContent);
    for (const obsolete of ['Ask Dydi', 'DesignID modules', 'Mapped classes', 'Portal entry']) assert(!text.includes(obsolete), obsolete);
    assert(!await page.$('#dydi-question'));
    assert(await page.$(sandbox ? 'a[href="/base-camp"]' : 'a[href="/login?mode=signup"]'));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'horizontal overflow at ' + width);
    const path = `tmp/entry-navigation/${sandbox ? 'sandbox' : 'live'}-${base.startsWith('https') ? 'published' : 'local'}-${width}.png`;
    fs.mkdirSync('tmp/entry-navigation', { recursive: true }); await page.screenshot({ path }); out.screenshots.push(path);
  }
  pass('anonymous landing at 1280/390/320; obsolete counts and inactive Ask Dydi removed; no overflow');
  if (sandbox) {
    // GET entry already existed. No new credential or authentication bypass introduced.
    await page.goto(base + '/base-camp', { waitUntil: 'networkidle2', timeout: 90000 });
    assert.equal(new URL(page.url()).pathname, '/hq');
    assert(await page.$('.hq-sidebar'));
    await page.goto(base + '/hq', { waitUntil: 'networkidle2', timeout: 90000 });
    assert.equal(new URL(page.url()).pathname, '/hq');
    assert((await context.cookies()).some(c => c.name === 'dydd_sandbox_review' && c.httpOnly));
    pass('existing sandbox Base Camp teaching preview and ordinary /hq revisit retain isolated review continuity');
    // Keep the review cookie to prove it cannot replace a real learner.
  } else {
    for (const route of ['/owner', '/sandbox-review', '/command-center', '/api/command-center/accounts']) assert.equal((await fetch(base + route, { redirect: 'manual' })).status, 404, route);
    const hq = await fetch(base + '/hq', { redirect: 'manual' });
    const body = await hq.text(); assert(hq.headers.get('location')?.includes('/login') || body.includes('/login'));
    pass('anonymous app still requires login; public production owner/review/API routes remain 404');
  }
  const password = crypto.randomBytes(20).toString('hex'), email = `entry-nav-${crypto.randomUUID()}@example.invalid`;
  const made = await admin.auth.admin.createUser({ email, password, email_confirm: true }); assert(!made.error, made.error?.message); id = made.data.user.id;
  let cookies = [];
  const client = createServerClient(cfg.project_url, cfg.anon_key, { cookies: { getAll: () => cookies, setAll: values => { cookies = values; } } });
  const signed = await client.auth.signInWithPassword({ email, password }); assert(!signed.error, signed.error?.message);
  await page.setCookie(...cookies.map(c => ({ name: c.name, value: c.value, url: base })));
  await page.goto(base, { waitUntil: 'networkidle2', timeout: 90000 });
  assert.equal(new URL(page.url()).pathname, '/hq');
  assert(await page.$eval('main', (e, expected) => e.textContent.includes(expected), email));
  assert(!await page.$eval('main', e => e.textContent.includes('Owner Command Center')), 'ordinary learner must not gain owner dashboard control');
  if (!sandbox) assert(await page.$eval('.app-footer', e => e.textContent.includes('Owner sign-in')));
  assert(!new URL(page.url()).searchParams.has('review'), 'real learner was replaced by preview');
  await page.reload({ waitUntil: 'networkidle2', timeout: 90000 });
  assert.equal(new URL(page.url()).pathname, '/hq');
  pass('real separate synthetic learner session: / opens Base Camp, reload persists identity, no preview substitution or owner link');
  assert.deepEqual(out.errors, []);
} finally {
  if (browser) await browser.close();
  if (id) { const r = await admin.auth.admin.deleteUser(id); assert(!r.error, r.error?.message); pass('synthetic account removed'); }
  fs.mkdirSync('tmp/entry-navigation', { recursive: true });
  fs.writeFileSync(`tmp/entry-navigation/${sandbox ? 'sandbox' : 'live'}-${base.startsWith('https') ? 'published' : 'local'}.json`, JSON.stringify(out, null, 2));
}
