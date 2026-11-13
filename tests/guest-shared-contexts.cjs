const assert = require('node:assert/strict');
const load = require('../scripts/fruitlife-test-load.cjs');
let owned = [], ownedCalls = [], authCalls = [], filterCalls = [], revoked = false;
let rows = {};
class Query {
  constructor(table) { this.table = table; this.filters = []; }
  select(fields) { this.fields = fields; return this; }
  eq(key, value) { this.filters.push(row => row[key] === value); return this; }
  is(key, value) { return this.eq(key, value); }
  in(key, values) { this.filters.push(row => values.includes(row[key])); return this; }
  or(value) { assert.equal(value, 'source.is.null,source.neq.public_guest'); this.filters.push(row => row.source !== 'public_guest'); return this; }
  order() { return this; }
  limit(n) { this.count = n; return this; }
  range(start, end) { this.start = start; this.end = end; return this; }
  result(single = false) {
    let data = (rows[this.table] || []).filter(row => this.filters.every(f => f(row)));
    if (this.start !== undefined) data = data.slice(this.start, this.end + 1);
    if (this.count) data = data.slice(0, this.count);
    return { data: single ? data[0] || null : data, error: null };
  }
  single() { return Promise.resolve(this.result(true)); }
  maybeSingle() { return Promise.resolve(this.result(true)); }
  then(resolve, reject) { return Promise.resolve(this.result()).then(resolve, reject); }
}
const db = { from: table => new Query(table), auth: { admin: { getUserById: async id => {
  authCalls.push(id); return { data: { user: { id, email: 'actual+exact@example.invalid', email_confirmed_at: 'confirmed' } }, error: null };
} } } };
const mocks = {
  '@/lib/supabase/admin': { createSupabaseAdminClient: () => db },
  '@/lib/public-assessments/identity': { getOwnedAssessmentSnapshots: async user => { ownedCalls.push(user); return owned; } },
  '@/lib/public-assessments/guest-account': { filterGuestBridgeServiceSnapshots: async (snapshots, client) => {
    assert.equal(client, db); filterCalls.push(snapshots); return snapshots.filter(s => !revoked || s.source !== 'public_guest');
  } },
  '@/lib/public-assessments/gifts-account': {},
};
const waypoint = load('lib/waypoints/user-context.ts', mocks);
const fruit = load('lib/fruitlife360/payload.ts', mocks);
const circle = load('lib/circles/data.ts', mocks);
const { fruitLifeInstrumentVersion } = load('lib/fruitlife360/intake.ts', mocks);
const snapshot = (id, primary, source = 'designid_app') => ({ id, source, assessment_type: 'designid',
  user_id: 'account', participant_id: 'participant', created_at: '2026-11-01', source_submitted_at: '2026-11-01',
  scores: { summary: { Primary: primary, Secondary: 'Steward' }, scores: { Architect_Pts: 40, Artisan_Pts: 30, Shepherd_Pts: 20, Steward_Pts: 10 } } });
const native = snapshot('native', 'Architect'), guest = { ...snapshot('guest', 'Shepherd', 'public_guest'), created_at: '2026-11-12', source_submitted_at: '2026-11-12' };
const session = { id: 'session', created_by_user_id: 'account', participant_id: 'participant', metadata: { instrumentVersion: fruitLifeInstrumentVersion }, participant_email: 'typed-victim@example.invalid', participant_name: 'Fixture', observer_goal: 0, observer_completed_count: 0 };
(async () => {
  rows = { fruitlife_360_sessions: [session], fruitlife_360_responses: [], assessment_participants: [{ id: 'participant', user_id: 'account' }], assessment_snapshots: [native, guest], school_profiles: [], dydd_circle_memberships: [] };
  owned = [guest, native];
  assert.equal(await waypoint.getSavedWaypointPrimary('account', 'actual+exact@example.invalid'), 'Shepherd');
  assert.deepEqual(ownedCalls.at(-1), { id: 'account', email: 'actual+exact@example.invalid' });
  const newer = await fruit.buildFruitLifePayloadForSession(db, 'session');
  assert.equal(newer.design_id_primary, 'Shepherd'); assert.equal(newer.design_id_secondary, 'Steward');
  assert.deepEqual(ownedCalls.at(-1), { id: 'account', email: 'actual+exact@example.invalid' });
  assert.deepEqual(authCalls, ['account']);
  let data = await circle.loadCircleData('circle', 'account', {}, db);
  assert.equal(data.members[0].primary, 'Shepherd'); assert.equal(filterCalls.at(-1).length, 2, 'merged duplicate rows filtered once');
  owned = [native]; revoked = true;
  assert.equal(await waypoint.getSavedWaypointPrimary('account', 'actual+exact@example.invalid'), 'Architect');
  const fallback = await fruit.buildFruitLifePayloadForSession(db, 'session');
  assert.equal(fallback.design_id_primary, 'Architect');
  for (const [key, value] of Object.entries(newer)) if (!['design_id_primary', 'design_id_secondary'].includes(key)) assert.deepEqual(fallback[key], value, `${key} unchanged`);
  data = await circle.loadCircleData('circle', 'account', {}, db); assert.equal(data.members[0].primary, 'Architect');
  session.created_by_user_id = null;
  await fruit.buildFruitLifePayloadForSession(db, 'session'); assert.equal(authCalls.at(-1), 'account', 'participant owner account is verified');
  rows.assessment_participants[0].user_id = null;
  rows.assessment_snapshots = [{ ...guest, user_id: null }, { ...native, user_id: null }, snapshot('foreign', 'Artisan')];
  const callsBefore = ownedCalls.length;
  const legacy = await fruit.buildFruitLifePayloadForSession(db, 'session');
  assert.equal(legacy.design_id_primary, 'Architect'); assert.equal(ownedCalls.length, callsBefore, 'unowned legacy never resolves contact email');
  rows.assessment_participants = [];
  assert.equal((await fruit.buildFruitLifePayloadForSession(db, 'session')).design_id_primary, '', 'missing participant cannot select snapshots');
  console.log('PASS shared contexts: newer guest, revoked native fallback, exact verified Auth identity, native/legacy ownership, unchanged Fruitful Life 360 scores and approved language');
})().catch(error => { console.error(error); process.exitCode = 1; });
