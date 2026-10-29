// GET-only acceptance: exercises the exact stale Vercel sandbox branch entry.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
const bases = ['https://dydd-online-school-git-sandbox-dydd-6069s-projects.vercel.app', 'https://dydd-online-school-sandbox.vercel.app'];
const browser = await puppeteer.launch({args: chromium.args.filter(x => x !== '--single-process'), executablePath: await chromium.executablePath(), headless: true});
const checks = [], errors = [];
fs.mkdirSync('tmp/sandbox-owner-access', {recursive: true});
try {
  for (const base of bases) {
    for (const width of [1280, 390]) {
      const context = await browser.createBrowserContext(), page = await context.newPage();
      await page.setViewport({width, height: 1000});
      page.on('pageerror', e => errors.push(e.message));
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
          errors.push('Unexpected mutation ' + request.method() + ' ' + new URL(request.url()).pathname);
          return request.abort();
        }
        return request.continue();
      });
      await page.goto(base, {waitUntil: 'domcontentloaded', timeout: 90000});
      await page.waitForSelector('a[href="/owner"]');
      console.log('Homepage loaded ' + new URL(base).hostname + ' ' + width);
      await Promise.all([page.waitForNavigation({waitUntil: 'domcontentloaded', timeout: 90000}), page.click('a[href="/owner"]')]);
      assert.equal(new URL(page.url()).pathname, '/command-center');
      await page.waitForSelector('a[href^="/command-center/accounts"]');
      console.log('Owner entry reached Command Center');
      assert(await page.$eval('body', e => e.textContent.includes('Private owner access is open')));
      assert((await context.cookies()).some(c => c.name === 'dydd_sandbox_review' && c.httpOnly && c.secure));
      await Promise.all([page.waitForNavigation({waitUntil: 'domcontentloaded', timeout: 90000}), page.click('a[href^="/command-center/accounts"]')]);
      assert.equal(new URL(page.url()).pathname, '/command-center/accounts');
      await page.waitForSelector('input[type="search"]');
      assert(await page.$eval('main', e => e.textContent.includes('SANDBOX DATA ONLY')));
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      // Plain URL and refresh must retain server-verified owner review continuity.
      await page.goto(base + '/command-center', {waitUntil: 'domcontentloaded', timeout: 90000});
      await page.waitForSelector('a[href^="/command-center/accounts"]');
      assert.equal(new URL(page.url()).pathname, '/command-center');
      assert(await page.$('a[href^="/command-center/accounts"]'));
      await page.reload({waitUntil: 'domcontentloaded', timeout: 90000});
      assert.equal(new URL(page.url()).pathname, '/command-center');
      await page.screenshot({path: 'tmp/sandbox-owner-access/' + new URL(base).hostname + '-' + width + '.png', fullPage: true});
      checks.push({base, width, result: 'PASS actual homepage Owner click, Accounts click, secure continuity cookie, plain URL, reload, no overflow'});
      await context.close();
    }
    for (const query of ['', '?review=owner&key=invalid-fixture']) {
      const response = await fetch(base + '/api/command-center/accounts' + query);
      assert.equal(response.status, 403);
      assert(response.headers.get('cache-control')?.includes('no-store'));
      assert(!JSON.stringify(await response.json()).includes('people'));
    }
    const direct = await fetch(base + '/command-center', {redirect: 'manual'});
    assert.equal(direct.status, 307);
    assert.equal(new URL(direct.headers.get('location'), base).pathname, '/login');
    checks.push({base, result: 'PASS anonymous/invalid Accounts API403, anonymous direct Command Center login, no private aggregate leak'});
  }
  for (const path of ['/owner', '/sandbox-review', '/command-center', '/api/command-center/accounts']) {
    const r = await fetch('https://dydd-online-school.vercel.app' + path, {redirect: 'manual'});
    assert.equal(r.status, 404, 'Production denial: ' + path);
  }
  assert.deepEqual(errors, []);
  checks.push({result: 'PASS production owner/review/Command Center/Accounts API404; zero browser JS errors or mutation requests; no assessments, email, user writes'});
  fs.writeFileSync('tmp/sandbox-owner-access/browser.json', JSON.stringify({checkedAt: new Date().toISOString(), checks, errors}, null, 2));
  console.log(JSON.stringify({status: 'PASS', checks, errors}, null, 2));
} finally {await browser.close();}
