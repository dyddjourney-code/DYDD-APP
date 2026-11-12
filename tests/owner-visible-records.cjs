const assert=require('node:assert/strict'),load=require('../scripts/fruitlife-test-load.cjs');
const {visibleOwnerOverviewRecords}=load('lib/public-assessments/owner-visible-records.ts');
const guest={source:'public_guest',provenance:{pipeline:'public_guest'},scores:{exact:1}},gift={source:'spiritual_gifts_app',provenance:{channel:'public_assessment'},scores:{exact:2}},native={source:'spiritual_gifts_app',provenance:{channel:'native_app'},scores:{exact:3}};
const hidden={id:'test',snapshots:[native,guest,gift]},onlyTests={id:'tests-only',snapshots:[native]},real={id:'real',snapshots:[native]},records=[hidden,onlyTests,real],before=JSON.stringify(records);
const visible=visibleOwnerOverviewRecords(records,r=>r.id!=='real');assert.equal(visible.length,2);assert.deepEqual(visible[0].snapshots,[guest,gift]);assert.equal(visible[0].snapshots[0],guest);assert.equal(visible[1],real);assert.equal(JSON.stringify(records),before);
console.log('PASS real paid/coupon/public Gifts records remain visible despite merged excluded native test identity; native test records stay hidden, original objects unchanged');
