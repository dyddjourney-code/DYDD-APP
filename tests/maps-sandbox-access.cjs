// Exercise the real page's server authorization and rendered foundation, without database writes.
const assert = require('node:assert/strict');
const load = require('../scripts/fruitlife-test-load.cjs');
const { renderToStaticMarkup } = require('react-dom/server');
let sandbox = true, user = null, error = null, reads = 0;
const Page = load('app/command-center/maps/page.tsx', {
  'next/navigation': { notFound() { throw Error('NOT_FOUND'); }, redirect(href) { throw Error('REDIRECT:' + href); } },
  '@/lib/environment': { isSandbox: () => sandbox },
  '@/lib/supabase/server': { createSupabaseServerClient: async () => ({auth: { getUser: async () => { reads++; return {data: {user}, error}; } }}) },
  './maps.module.css': new Proxy({}, {get: (_, key) => String(key)}),
}).default;
(async () => {
  await assert.rejects(Page(), /REDIRECT:\/login\?next=%2Fcommand-center%2Fmaps/);
  user = {email: 'learner@example.invalid', email_confirmed_at: '2026-11-24', user_metadata: {email: 'dyddjourney@gmail.com', is_admin: true}};
  await assert.rejects(Page(), /NOT_FOUND/);
  user = {email: 'dyddjourney@gmail.com'};
  await assert.rejects(Page(), /NOT_FOUND/);
  user.email_confirmed_at = '2026-11-24';
  error = {message: 'expired'};
  await assert.rejects(Page(), /REDIRECT/);
  error = null;
  for (const email of ['dyddjourney@gmail.com', 'john@discoverdivine.design', 'willoughbyhs@gmail.com']) {
    user.email = email;
    const html = renderToStaticMarkup(await Page());
    for (const phase of ['mission', 'approach', 'process', 'send']) assert(html.includes(`id="${phase}"`));
    for (const week of ['01', '02', '03', '04']) assert(html.includes(`Week ${week}`));
    assert(html.includes('MAPS foundation'));
  }
  sandbox = false; const before = reads;
  await assert.rejects(Page(), /NOT_FOUND/);
  assert.equal(reads, before, 'production denied before authentication');
  console.log('PASS MAPS: all three John identities render four phases/four labs; anonymous/expired redirect; learner/metadata spoof/unverified denied; production fails closed.');
})().catch(e => { console.error(e); process.exitCode = 1; });
