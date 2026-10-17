import fs from 'node:fs';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { createClient } from '@supabase/supabase-js';
process.loadEnvFile('.env.runtime');
const base = process.env.PREVIEW_ACCESS_BASE ?? 'http://localhost:3164';
const key = base.startsWith('https') ? JSON.parse(fs.readFileSync('tmp/private-production-review.json')).key : process.env.DYDD_REVIEW_TOKEN;
const c = JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-supabase.json'));
const admin = createClient(c.project_url, c.service_role_key, { auth: { persistSession: false } });
const bucket = admin.storage.from('assessment-report-pdfs');
const backup = new Map();
const slugs = ['discover-your-divine-design', 'designid-foundations', 'spiritual-gifts-service', 'fruitlife-360-formation', 'designpd-alignment'];
for (const mode of ['new', 'heather'])
    for (const slug of slugs) {
        const path = `preview-reflections/${mode}/${slug}.json`;
        const r = await bucket.download(path, { cacheNonce: crypto.randomUUID() }, { cache: "no-store" });
        backup.set(path, r.data ? Buffer.from(await r.data.arrayBuffer()) : null);
    }
const browser = await puppeteer.launch({ args: chromium.args, executablePath: await chromium.executablePath(), headless: true });
const tag = base.startsWith('https') ? 'live' : 'local';
try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1000 });
    for (const mode of ['owner', 'new']) {
        await page.setViewport({ width: 1280, height: 1000 });
        await page.goto(`${base}/${mode === 'owner' ? 'command-center' : 'base-camp'}?${new URLSearchParams({ review: mode, key })}`, { waitUntil: 'networkidle2' });
        console.log(`Opened ${mode} entry`);
        const entry = await page.$('aside a[href^="/field-kit"]');
        assert(entry, `${mode} navigation has Field Kit`);
        await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle2' }), entry.click()]);
        assert(!page.url().includes('/login'), 'Field Kit should not require another login');
        await page.waitForSelector('.fieldkit-report-row');
        console.log('Field Kit loaded ' + mode);
        const links = await page.$$eval('.fieldkit-report-history > .fieldkit-report-row a', els => els.map(a => ({ label: a.textContent.trim(), href: a.href })));
        fs.writeFileSync(`tmp/preview-visible-report-links-${tag}.json`, JSON.stringify(links));
        const workbook = await page.$('a[href*="/field-kit/reflections/discover-your-divine-design"]');
        assert(workbook);
        await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle2' }), workbook.click()]);
        assert(!page.url().includes('/login'));
        await page.waitForFunction(() => !document.body.textContent.includes('Loading your reflections'));
        const q = new URL(page.url()).searchParams;
        const api = `${base}/api/course-reflections?${new URLSearchParams({ courseSlug: 'discover-your-divine-design', review: q.get('review'), key })}`;
        const get = await fetch(api);
        let data = await get.json();
        assert.equal(get.status, 200, JSON.stringify(data));
        assert.equal(data.preview, true);
        console.log('Workbook/API loaded ' + mode);
        if (!data.rounds.length) {
            const b = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base }, body: JSON.stringify({ action: 'new-round', courseSlug: 'discover-your-divine-design' }) });
            assert.equal(b.status, 200, await b.text());
            data = await (await fetch(api)).json();
        }
        const round = data.rounds[0], question = round.questions[0], last = data.entries.filter(e => e.round_id === round.id && e.question_id === question.id).sort((a, b) => b.revision - a.revision)[0];
        const answer = `Preview access verification ${tag} ${mode}`;
        const body = { action: 'save', courseSlug: 'discover-your-divine-design', roundId: round.id, questionId: question.id, response: answer, expectedRevision: last?.revision ?? 0 };
        const saved = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base }, body: JSON.stringify(body) });
        assert.equal(saved.status, 200, await saved.text());
        const conflict = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        assert.equal(conflict.status, 409);
        console.log('Save and conflict passed ' + mode);
        await page.reload({ waitUntil: 'networkidle2' });
        await page.waitForFunction(() => document.body.textContent.includes('Edit my reflections'));
        assert((await page.$eval('body', e => e.textContent)).includes(answer));
        await page.evaluate(id => { const e = document.querySelector(`[data-question="${id}"]`); let p = e; while (p) {
            if (p.tagName === 'DETAILS')
                p.open = true;
            p = p.parentElement;
        } }, question.id);
        const article = await page.$(`[data-question="${question.id}"]`);
        const edit = await article.$('button');
        assert(edit);
        await edit.click();
        const textarea = await article.$('textarea');
        assert(textarea);
        await textarea.click();
        await page.keyboard.down('Control');
        await page.keyboard.press('A');
        await page.keyboard.up('Control');
        await textarea.type(answer + ' UI edited');
        await (await article.$('button')).click();
        await page.waitForFunction(id => document.querySelector(`[data-question="${id}"]`).textContent.includes('Saved to your preview workbook'), {}, question.id);
        const reread = await (await fetch(api)).json();
        const stored = reread.entries.filter(e => e.question_id === question.id && e.round_id === round.id).sort((a, b) => b.revision - a.revision)[0];
        assert.equal(stored.response, answer + ' UI edited', 'Browser edit must persist exact text');
        await page.reload({ waitUntil: 'networkidle2' });
        await page.waitForFunction(answer => document.body.textContent.includes(answer), {}, answer + ' UI edited');
        const text = await fetch(`${base}/api/course-reflections/export?${new URLSearchParams({ scope: 'round', courseSlug: 'discover-your-divine-design', round: round.id, review: q.get('review'), key })}`);
        assert.equal(text.status, 200);
        assert((await text.text()).includes(answer));
        const foreign = await fetch(api.replace(/key=[^&]+/, 'key=invalid'));
        const denied = await foreign.json();
        assert.equal(denied.signedIn, false);
        assert.equal(denied.entries.length, 0);
        for (const width of [1280, 390, 320]) {
            await page.setViewport({ width, height: 1000 });
            assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow ${width}`);
            await page.screenshot({ path: `tmp/preview-workbook-${tag}-${mode}-${width}.png`, fullPage: true });
        }
        const back = await page.$('nav.course-nav a[href^="/field-kit?"]');
        assert(back);
        await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle2' }), back.click()]);
        assert(!page.url().includes('/login'));
        console.log(`PASS ${mode}: actual navigation -> Field Kit -> workbook -> persistent save/reload/conflict -> TXT -> Field Kit; desktop/phone; no extra sign-in`);
    }
    for (const slug of slugs) {
        const api = `${base}/api/course-reflections?${new URLSearchParams({ courseSlug: slug, review: 'new', key })}`;
        const initial = await (await fetch(api)).json();
        assert(initial.canStart, slug);
        const start = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base }, body: JSON.stringify({ courseSlug: slug, action: 'new-round' }) });
        assert.equal(start.status, 200);
        const { round } = await start.json();
        const q = round.questions[0];
        const save = { courseSlug: slug, action: 'save', roundId: round.id, questionId: q.id, response: 'Preview lifecycle QA ' + tag, expectedRevision: 0 };
        const saved = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base }, body: JSON.stringify(save) });
        assert.equal(saved.status, 200);
        const fresh = await (await fetch(api)).json();
        assert(fresh.entries.some(e => e.round_id === round.id && e.response === save.response));
        const foreign = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://foreign.invalid' }, body: JSON.stringify({ ...save, expectedRevision: 1 }) });
        assert.equal(foreign.status, 403);
        const next = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base }, body: JSON.stringify({ courseSlug: slug, action: 'new-round' }) });
        assert.equal(next.status, 200);
        const archived = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base }, body: JSON.stringify({ ...save, expectedRevision: 1 }) });
        assert.equal(archived.status, 409);
        console.log('PASS ' + slug + ': durable save, next round, previous round read-only, foreign origin denied');
    }
    const h = await fetch(`${base}/api/course-reflections?${new URLSearchParams({ courseSlug: 'discover-your-divine-design', review: 'heather', key })}`);
    assert.equal(h.status, 200);
    const hd = await h.json();
    assert(!hd.entries.some(e => e.response.includes('Preview access verification')), 'Preview personas must not share answers');
    const all = await fetch(`${base}/api/course-reflections/export?${new URLSearchParams({ scope: 'all', review: 'new', key })}`);
    assert.equal(all.status, 200);
    const anon = await fetch(base + '/field-kit', { redirect: 'manual' });
    assert(anon.status >= 300 && anon.status < 400);
    const bad = await fetch(base + '/field-kit?review=owner&key=invalid', { redirect: 'manual' });
    assert(bad.status >= 300 && bad.status < 400);
    console.log('PASS anonymous/invalid-token denial, cross-persona isolation, export all. QA writes restored.');
}
finally {
    await browser.close();
    for (const [path, bytes] of backup) {
        if (bytes) {
            const r = await bucket.upload(path, bytes, { upsert: true, contentType: 'application/json' });
            if (r.error)
                throw r.error;
        }
        else
            await bucket.remove([path]);
    }
}
