const assert=require('node:assert/strict'),load=require('../scripts/fruitlife-test-load.cjs');
const {blankCirclePlan,scheduledDates}=load('lib/circles/plan.ts');
const {localInstant,localParts,circleMessageDrafts,renderLifecycle}=load('lib/lifecycle/templates.ts');
assert.equal(localInstant('2026-10-25','19:00','America/New_York'),'2026-10-25T23:00:00.000Z');
assert.equal(localInstant('2026-11-08','19:00','America/New_York'),'2026-11-09T00:00:00.000Z');
assert.throws(()=>localInstant('2027-03-14','02:30','America/New_York'),/does not exist/);
assert.equal(localInstant('2026-11-01','01:30','America/New_York'),'2026-11-01T05:30:00.000Z');
const p={...blankCirclePlan(),name:'QA Circle',startDate:'2026-11-01',time:'19:00',location:'QA Room',meetingCount:3,breaks:[{start:'2026-11-08',end:'2026-11-21'}]};
const dates=scheduledDates(p);assert.deepEqual(dates,['2026-11-01','2026-11-22','2026-11-29']);
const rows=circleMessageDrafts(p,'https://sandbox.example',false,new Date('2026-10-27T12:00:00Z'));
assert.equal(rows.filter(x=>x.template_id==='E02').length,3);
const first=rows.find(x=>x.message_key==='preparation-2');assert.match(first.body,/we|Our next Circle/);assert.equal(first.scheduled_at,'2026-11-15T14:00:00.000Z');
assert(!rows.some(x=>x.scheduled_at.startsWith('2026-11-07')&&x.template_id==='E02'));
assert(rows.every(x=>Date.parse(x.expires_at)>Date.parse(x.scheduled_at)||x.template_id==='D02'),'all usable drafts have bounded freshness');
assert(!rows.some(x=>/we discussed|you have not completed/i.test(x.body)));
assert(rows.find(x=>x.template_id==='D03').body.includes('Planned pauses: 2026-11-08 through 2026-11-21'));
assert.throws(()=>renderLifecycle('C02',{base:'https://example.com'}),/Missing email field/);
console.log('PASS timezone/DST forward and backward, holiday gaps, resume preparation, due times, no invented recap or unfinished claim, required rendering values');

// Circle bodies retain lesson names, but share one main Journey destination.
for(const target of ['Finish assigned content before each meeting','Work through assigned content together','Begin together; finish before the next meeting']){
 const drafts=circleMessageDrafts({...p,target},'https://sandbox.example',true,new Date('2026-10-20T12:00:00Z'));
 for(const draft of drafts){
  assert(!draft.body.includes('?lesson='),draft.message_key+' must not include lesson URLs');
  if(draft.kind!=='invitation'){
   assert.equal((draft.body.match(/https?:\/\/[^\s]+/g)||[]).length,1,draft.message_key+' has one body link');
   assert(draft.body.includes('Open the Journey: https://sandbox.example/journey'));
  }else assert(draft.body.includes('{{invitation_url}}'),'private join action stays intact');
 }
 const prep=drafts.find(d=>d.message_key==='preparation-2');
 assert(prep.body.includes('Follow-through from meeting 1:'));
 assert(prep.body.includes('If you have already finished'));
 assert(prep.body.includes('• '),'lesson titles are still listed');
 assert(!drafts.some(d=>d.message_key.startsWith('follow-through-')),'follow-through is combined, not a third campaign');
}
function assertRoutineCap(drafts,zone){
 const routine=drafts.filter(d=>d.kind==='member'&&d.category==='circle').sort((a,b)=>a.scheduled_at.localeCompare(b.scheduled_at));
 const days=routine.map(d=>{const v=localParts(new Date(d.scheduled_at),zone);return Date.parse(`${v.year}-${v.month}-${v.day}T12:00:00Z`)/86400000;});
 for(const day of days)assert(days.filter(other=>other>=day&&other<day+7).length<=2,'maximum two routine participant emails in seven local days');
}
for(const plan of [
 {...p,breaks:[],meetingCount:8},
 {...p,breaks:[],meetingCount:14,rhythm:'Custom',customDays:'1'},
 {...p,breaks:[],meetingCount:3,movedDates:{'2':'2026-11-03'}},
])assertRoutineCap(circleMessageDrafts(plan,'https://sandbox.example',false,new Date('2026-10-20T12:00:00Z')),plan.timezone);
console.log('PASS single Journey CTA, preserved invitation action and lesson names, honest combined follow-through, weekly/custom/moved-date two-email cap');
