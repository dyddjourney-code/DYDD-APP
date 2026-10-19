const assert=require('node:assert/strict'),load=require('../scripts/fruitlife-test-load.cjs');
const {nativeDesignPdRecoveryPayload}=load('lib/assessments/native-designpd-recovery.ts'),{scoreDesignPd}=load('lib/designpd/engine.ts');
const source={id:'retained-designid',assessment_type:'designid',created_at:'2026-10-15T00:00:00Z',scores:{scores:{Architect_Pts:22,Artisan_Pts:21,Shepherd_Pts:41,Steward_Pts:16,Total_Pts:100,Band_Architect:'Steady',Band_Artisan:'Steady',Band_Shepherd:'Abundant',Band_Steward:'Steady'},summary:{Primary:'Shepherd',Secondary:'Architect'}}};
// Source bands must use the actual instrument’s vocabulary.
source.scores.scores.Band_Architect='Steady';source.scores.scores.Band_Artisan='Steady';source.scores.scores.Band_Shepherd='Abundant';source.scores.scores.Band_Steward='Steady';
const result=scoreDesignPd(source),snapshot={id:'native-pd',assessment_type:'designpd',created_at:source.created_at,scores:{channel:'native_app',designIdSnapshotId:source.id,axisScores:result.axisScores,axisTendencies:result.axisTendencies,movement:result.movement}};
const original=JSON.stringify({source,snapshot});
const payload=nativeDesignPdRecoveryPayload(snapshot,source);assert(payload,'Complete saved contract recovers');for(const axis of ['plan','decide','do'])assert.equal(payload[axis+'_score'],snapshot.scores.axisScores[axis]);assert(payload.plan_core);assert.equal(JSON.stringify({source,snapshot}),original);
for(const [field,key,bad] of [['axisScores','plan',99],['axisTendencies','plan','Wrong'],['movement','plan',0.49]]){const changed=structuredClone(snapshot);changed.scores[field][key]=bad;assert.equal(nativeDesignPdRecoveryPayload(changed,source),null);}
assert.equal(nativeDesignPdRecoveryPayload(snapshot,{...source,id:'foreign-source'}),null);assert.equal(nativeDesignPdRecoveryPayload(snapshot,{...source,assessment_type:'designpd'}),null);
console.log('PASS verified native DesignPD recovery: saved scores/movements/tendencies, source identity, no mutation, mismatches refused.');
