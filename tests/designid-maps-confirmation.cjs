// Run: node tests/designid-maps-confirmation.cjs. No database/email writes.
const assert = require('node:assert/strict');
const load = require('../scripts/fruitlife-test-load.cjs');
{
  const { designIdQuestionBlocks } = load('lib/designid/intake.ts');
  const { parseDesignIdAllocationAnswers, scoreDesignId } = load('lib/designid/engine.ts');
  const { mapsConfirmationItems: items, parseMapsConfirmation, scoreMapsConfirmation } = load('lib/designid/maps-confirmation.ts');
  const { buildDesignIdReportPayload } = load('lib/designid/report.ts');
  const form = new FormData();
  for (const block of designIdQuestionBlocks) for (const [i, statement] of block.statements.entries()) form.set(`designid_points_${statement.code}`, String([3, 2, 0, 0][i]));
  const main = scoreDesignId(parseDesignIdAllocationAnswers(form));
  assert.equal(main.totalPoints, 100);
  assert.throws(() => parseMapsConfirmation(form));
  for (const [i, item] of items.entries()) form.set(`designid_maps_${item.id}`, ['most', 'often', 'sometimes', 'least'][Math.floor(i/3)]);
  const assignments = parseMapsConfirmation(form);
  const original = JSON.stringify(main);
  const confirmation = scoreMapsConfirmation(assignments, main);
  assert.equal(JSON.stringify(main), original, 'Confirmation must never mutate the main score/order');
  for (const reflection of ['Architect', 'Artisan', 'Shepherd', 'Steward']) {
    const subset = items.filter(item => item.reflection === reflection);
    const total = subset.reduce((sum, item) => sum + ({ most:3, often:2, sometimes:1, least:0 }[assignments[item.id]]), 0);
    assert.equal(confirmation.reflectionMeanWeights[reflection], total/subset.length, 'Unequal item counts require mean weights');
  }
  form.set('designid_maps_purpose', 'invalid'); assert.throws(() => parseMapsConfirmation(form));
  form.set('designid_maps_purpose', 'often'); assert.throws(() => parseMapsConfirmation(form));
  form.set('designid_maps_purpose', 'most'); form.append('designid_maps_purpose', 'most'); assert.throws(() => parseMapsConfirmation(form));
  assert.throws(() => parseDesignIdAllocationAnswers(new FormData()));
  const strong = { ...main, scores:{Architect:50, Artisan:30, Shepherd:25, Steward:15}, rankOrder:['Architect','Artisan','Shepherd','Steward'], primary:'Architect', secondary:'Artisan' };
  assert.equal(scoreMapsConfirmation(assignments, strong).suggestedTieReflection, null);
  const tied = { ...strong, scores:{Architect:40, Artisan:40, Shepherd:25, Steward:15} };
  assert.equal(scoreMapsConfirmation(assignments, tied).suggestedTieReflection, 'Artisan');
  assert.equal(tied.primary, 'Architect');
  // A flat confirmation cannot claim to resolve a main-score tie.
  const flat = Object.fromEntries(items.map(item => [item.id, 'often']));
  assert.equal(scoreMapsConfirmation(flat, tied).suggestedTieReflection, null);
  const report = buildDesignIdReportPayload({ participantEmail:'qa@example.invalid', participantName:'Local QA', result:{ ...main, mapsConfirmation:confirmation } });
  assert(!report.Integrative_Summary.includes('MAPS'), 'Private research language must not leak into customer summary');
  assert.equal(report.MAPS_Confirmation.version, confirmation.version);
  console.log('PASS: MAPS validation, balanced buckets, mean normalization, primary-score invariance, tie clues/no forced tie-break, report integration.');
}
