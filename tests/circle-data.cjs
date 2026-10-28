const assert = require('node:assert/strict');
const load = require('../scripts/fruitlife-test-load.cjs');
const A='10000000-0000-4000-8000-000000000001', B='10000000-0000-4000-8000-000000000002', PREVIEW='10000000-0000-4000-8000-000000000003';
let actorId='host', rows={}, calls=[], failTable=null;
class Query {
  constructor(table){ this.table=table;this.filters=[]; }
  select(fields){this.fields=fields;return this;}
  eq(key,value){this.filters.push(row=>row[key]===value);calls.push({table:this.table,op:'eq',key,value});return this;}
  in(key,values){this.filters.push(row=>values.includes(row[key]));calls.push({table:this.table,op:'in',key,value:values});return this;}
  order(){return this;}
  range(start,end){this.start=start;this.end=end;return this;}
  result(single=false){if(this.table===failTable)return {data:null,error:{message:'PRIVATE CUSTOMER EMAIL AND SCORES'}};let data=(rows[this.table]||[]).filter(row=>this.filters.every(f=>f(row)));if(this.start!==undefined)data=data.slice(this.start,this.end+1);return {data:single?data[0]||null:data,error:null};}
  maybeSingle(){return Promise.resolve(this.result(true));}
  then(resolve,reject){return Promise.resolve(this.result()).then(resolve,reject);}
}
let previewDownloads=0;const db={from(table){calls.push({table,op:'from'});return new Query(table);},storage:{from(bucket){assert.equal(bucket,'assessment-report-pdfs');return {download:async file=>{assert.equal(file,'sandbox-owner/john-assessment-report.json');previewDownloads++;return {data:{text:async()=>JSON.stringify({all:[snap('saved-owner',null,'designid',allocation)]})},error:null};}};}}};
const mocks={
  'server-only':{},
  '@/lib/supabase/admin':{createSupabaseAdminClient:()=>db},
  '@/lib/supabase/server':{createSupabaseServerClient:async()=>({auth:{getUser:async()=>({data:{user:actorId?{id:actorId}:null}})}})},
  '@/lib/review/heather':{isReviewRequest:p=>p.review==='heather'&&p.key==='valid'},
  '@/lib/owner-preview':{isOwnerPreviewRequest:p=>p.review==='owner'&&p.key==='valid'},
  'next/server':{NextResponse:{json:(body,options)=>Response.json(body,options)}},
};
const data=load('lib/circles/data.ts',mocks),route=load('app/api/circles/data/route.ts',mocks);
const allocation={scores:{Architect_Pts:60,Artisan_Pts:20,Shepherd_Pts:10,Steward_Pts:10,Architect_Pct:0.6,Total_Pts:100},summary:{Primary:'Architect'},scoringVersion:'designid-allocation-5x20-v1'};
const snap=(id,user_id,type,scores,participant_id=null,date='2026-10-20T12:00:00Z')=>({id,user_id,participant_id,assessment_type:type,scores,source_submitted_at:date,created_at:date});
function reset(){actorId='host';calls=[];failTable=null;rows={
 journey_circle_plans:[{id:A,user_id:'host',preview_scope:null,plan:{participants:[{email:'fake@invalid',name:'Unaccepted impersonation'}]}},{id:B,user_id:'other',preview_scope:null,plan:{participants:[]}},{id:PREVIEW,user_id:null,preview_scope:'owner',plan:{participants:[{email:'fake@invalid'}]}}],
 dydd_circle_memberships:[],assessment_participants:[{id:'host-p',user_id:'host',display_name:'Actual host'},{id:'fake-p',user_id:'victim',normalized_email:'fake@invalid',display_name:'Unaccepted impersonation'}],school_profiles:[{id:'host',full_name:'Saved host'}],
 assessment_snapshots:[snap('host-id','host','designid',allocation,'host-p'),snap('victim-pd','victim','designpd',{movement:{plan:.4,decide:.3,do:.2}},'fake-p')],
};}
async function get(id=A,extra=''){const response=await route.GET(new Request('https://school.invalid/api/circles/data?circleId='+id+extra));return {status:response.status,headers:response.headers,body:await response.json()};}
(async()=>{
 reset();let r=await get();assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'private, no-store');assert.equal(r.headers.get('vary'),'Cookie');assert.deepEqual(r.body.counts,{members:1,designId:1,designPd:0,gifts:0});assert.equal(r.body.members[0].name,'Saved host');assert.equal(r.body.members[0].role,'Host');assert.deepEqual(r.body.members[0].designId,{architect:60,artisan:20,shepherd:10,steward:10});assert.equal(r.body.members[0].designPd,null);assert.equal(r.body.members[0].primary,'Architect');
 assert(!calls.some(c=>['normalized_email','display_name','email'].includes(c.key)),'No account discovery by fake roster contact');
 console.log('PASS single actual host + fake roster; saved 100-point/max60 allocation; no generated DesignPD');
 // Accepted membership must have an account AND still be in this exact saved roster.
 reset();rows.journey_circle_plans[0].plan.participants.push({email:'member@invalid'});
 rows.dydd_circle_memberships=[
  {circle_id:A,status:'accepted',user_id:'member',email:'member@invalid',display_name:'Accepted member'},
  {circle_id:A,status:'invited',user_id:'victim',email:'fake@invalid'},
  {circle_id:A,status:'accepted',user_id:'removed',email:'removed@invalid'},
  {circle_id:A,status:'left',user_id:'left',email:'fake@invalid'},
  {circle_id:A,status:'accepted',user_id:null,email:'fake@invalid'},
  {circle_id:B,status:'accepted',user_id:'victim',email:'fake@invalid'},
 ];
 rows.assessment_participants.push({id:'member-p',user_id:'member'});
 rows.assessment_snapshots.push(
  snap('member-id',null,'designid',{reportPayload:{Architect_Pts:'72',Artisan_Pts:'64',Shepherd_Pts:'48',Steward_Pts:'40',Primary:'Artisan'}},'member-p'),
  snap('member-pd',null,'designpd',{movement:{plan:.2,decide:-.15,do:0},axisScores:{plan:20,decide:15,do:0}},'member-p'),
  snap('member-gifts','member','spiritual_gifts',{topGifts:[{label:'Teaching'},{label:'Helps'}]}),
  snap('host-draft','host','designid',{...allocation,status:'draft'},'host-p','2026-10-27T12:00:00Z'),
  snap('host-unowned','host','designpd',{movement:{plan:.4,decide:.4,do:.4}},'fake-p','2026-10-27T12:00:00Z'),
  snap('conflicting','member','designpd',{movement:{plan:.4,decide:.4,do:.4}},'host-p','2026-10-27T12:00:00Z'),
 );
 r=await get();assert.equal(r.status,200);assert.deepEqual(r.body.members.map(m=>m.id),['host','member']);assert.equal(r.body.members[0].designPd,null,'Foreign participant cannot leak via direct user_id');assert.deepEqual(r.body.members[1].designId,{architect:72,artisan:64,shepherd:48,steward:40},'Legacy raw values remain unnormalized');assert.deepEqual(r.body.members[1].designPd,{plan:20,decide:-15,do:0},'Use signed movement, not absolute axisScores');assert.deepEqual(r.body.members[1].gifts,['Teaching','Helps']);assert.deepEqual(r.body.counts,{members:2,designId:2,designPd:1,gifts:1});
 console.log('PASS accepted account/roster intersection, independent saved result types, linked ownership, conflicting identity/draft rejection, legacy raw points');
 actorId='other';calls=[];r=await get(B);assert.equal(r.status,200);assert.deepEqual(r.body.members.map(m=>m.id),['other']);assert.equal(r.body.members[0].designId,null);assert.equal(r.body.members[0].designPd,null);assert.deepEqual(r.body.members[0].gifts,[]);
 console.log('PASS two-circle separation with distinct creators and assessment coverage');
 calls=[];r=await get(A);assert.equal(r.status,404);assert(!calls.some(c=>c.table==='assessment_snapshots'||c.table==='dydd_circle_memberships'));
 actorId='member';calls=[];r=await get(A);assert.equal(r.status,404,'Accepted member is not creator');assert(!calls.some(c=>c.table==='assessment_snapshots'));
 actorId=null;calls=[];assert.equal((await get()).status,401);assert.equal(calls.length,0);actorId='host';assert.equal((await get('bad')).status,400);assert.equal((await get(A,'&review=owner&key=invalid')).body.preview,false);
 console.log('PASS unauthorized query, member-not-creator, unauthenticated and malformed ID denied before private reads');
 reset();calls=[];r=await get(PREVIEW,'&review=owner&key=valid');assert.equal(r.status,200);assert.equal(r.body.preview,true);assert.deepEqual(r.body.members,[]);assert.deepEqual(r.body.counts,{members:0,designId:0,designPd:0,gifts:0});assert(!calls.some(c=>c.table!=='journey_circle_plans'));assert.equal((await get(A,'&review=owner&key=valid')).status,404);
 console.log('PASS explicit preview no real records, no assessment/membership/profile queries, exact preview circle scope');
 reset();failTable='assessment_snapshots';r=await get();assert.equal(r.status,503);assert(!JSON.stringify(r.body).includes('PRIVATE'));failTable='journey_circle_plans';assert.equal((await get()).status,503);
 console.log('PASS fail-closed generic errors without PII');
 assert.deepEqual(data.savedDesignPd({scores:{Move_DreamerMinusDoer:'-0.3',Move_Feel_ItMinusThink_It:'0.15',Move_SoloMinusTogether:'0'}}),{plan:-30,decide:15,do:0});
 assert.deepEqual(data.savedDesignPd({reportPayload:{move_dreamer_minus_doer:'20.0%',move_feel_it_minus_think_it:'-15.0%',move_solo_minus_together:'0.0%'}}),{plan:20,decide:-15,do:0});
 assert.equal(data.savedDesignPd({axisScores:{plan:20,decide:15,do:0}}),null,'Unsigned magnitudes cannot establish movement');
 assert.equal(data.savedDesignPd({movement:{plan:.6,decide:0,do:0}}),null);
 assert.equal(data.savedDesignPd({movement:{plan:.1,decide:0}}),null);
 assert.equal(data.savedDesignId({...allocation,scores:{...allocation.scores,Architect_Pts:61,Artisan_Pts:19}}).designId,null);
 assert.equal(data.savedDesignId({...allocation,scores:{...allocation.scores,Architect_Pts:59}}).designId,null);
 assert.equal(data.savedDesignId({scores:{Architect_Pct:.6,Artisan_Pct:.2,Shepherd_Pct:.1,Steward_Pct:.1}}).designId,null);
 assert.deepEqual(data.savedGifts({summary:{Top1_Name:'Wisdom',Top2_Name:'Mercy'}}),['Wisdom','Mercy']);
 console.log('PASS native/import/reportPayload movement signs, formatted percentages, zero/bounds/missing axes; raw points not percentages; max60/sum100 allocation validation; historical gifts');
 reset();rows.assessment_snapshots=[];
 for(let i=0;i<510;i++)rows.assessment_snapshots.push(snap('history-'+i,'host','designid',allocation));
 rows.assessment_snapshots.push(snap('older-pd','host','designpd',{movement:{plan:-.5,decide:.5,do:0}},null,'2020-01-01T12:00:00Z'));
 r=await get();assert.deepEqual(r.body.members[0].designPd,{plan:-50,decide:50,do:0});
 rows.assessment_snapshots=rows.assessment_snapshots.filter(row=>row.assessment_type==='designpd');
 r=await get();assert.equal(r.body.members[0].designId,null);assert.equal(r.body.members[0].primary,null);assert.deepEqual(r.body.members[0].designPd,{plan:-50,decide:50,do:0});
 console.log('PASS pagination retains older independently completed types; saved PD without ID stays independent');
 const preview=await data.loadOwnerPreviewCircleData(A,{storage:{from:bucket=>({download:async file=>{assert.equal(bucket,'assessment-report-pdfs');assert.equal(file,'sandbox-owner/john-assessment-report.json');return {data:{text:async()=>JSON.stringify({all:[snap('saved-owner',null,'designid',allocation)]})},error:null};}})}});assert.deepEqual(preview.counts,{members:1,designId:1,designPd:0,gifts:0});assert.equal(preview.preview,true);assert.equal(preview.members[0].designPd,null);
 console.log('PASS explicit private saved-owner report only, no roster attachment, missing Gifts/PD never fabricated');
 reset();process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT='sandbox';calls=[];r=await get(PREVIEW,'&review=owner&key=valid');assert.equal(r.status,200);assert.deepEqual(r.body.counts,{members:1,designId:1,designPd:0,gifts:0});assert.equal(previewDownloads,1);assert(calls.every(c=>c.table==='journey_circle_plans'));process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT='production';r=await get(PREVIEW,'&review=owner&key=valid');assert.equal(r.body.counts.members,0);assert.equal(previewDownloads,1);
 console.log('PASS exact authorized owner-preview circle + sandbox environment guard; production preview never reads owner copy');

})().catch(error=>{console.error(error);process.exitCode=1;});
