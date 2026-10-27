const assert=require('node:assert/strict'),load=require('../scripts/fruitlife-test-load.cjs');
const circle={id:'owned-circle',revision:1},campaign={id:'current-campaign'};let actor={userId:'creator',previewScope:null},allowOrigin=true,rpcs=[];
const db={rpc:async(name,args)=>{rpcs.push({name,args});return {data:{id:args.message_id,revision:args.expected_revision+1,excluded_at:args.exclude?'2026-10-27T20:00:00Z':null},error:null};},from(table){const filters={};const q={select(){return q;},eq(k,v){filters[k]=v;return q;},single(){return Promise.resolve(run());},maybeSingle(){return Promise.resolve(run());}};function run(){return {error:null,data:table==='dydd_circle_campaigns'?campaign:filters.id==='own-message'&&filters.campaign_id===campaign.id?{id:'own-message'}:null};}return q;}};
const mocks={'server-only':{},'next/server':{NextResponse:{json:(body,options)=>new Response(JSON.stringify(body),options)}},'@/lib/circles/server':{circleActor:async()=>actor,sameOrigin:()=>allowOrigin,circleQuery:()=>({eq(){return this;},maybeSingle:async()=>({data:circle,error:null})})},'@/lib/supabase/admin':{createSupabaseAdminClient:()=>db}};
const {POST}=load('app/api/circles/messages/route.ts',mocks);
function request(body){return new Request('https://sandbox.example/api/circles/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({circleId:'owned-circle',messageId:'own-message',revision:7,...body})});}
(async()=>{
 for(const action of ['exclude','skip','restore']){const response=await POST(request({action}));assert.equal(response.status,200);const result=await response.json();assert.equal(result.message.revision,8);assert.equal(rpcs.at(-1).name,'dydd_set_circle_message_excluded');assert.equal(rpcs.at(-1).args.exclude,action!=='restore');assert.equal(rpcs.at(-1).args.actor_user,'creator');assert.equal(rpcs.at(-1).args.expected_revision,7);}
 let before=rpcs.length;assert.equal((await POST(request({action:'exclude',messageId:'other-campaign-message'}))).status,409);assert.equal(rpcs.length,before);
 assert.equal((await POST(request({action:'restore',revision:null}))).status,409);assert.equal(rpcs.length,before);
 allowOrigin=false;assert.equal((await POST(request({action:'exclude'}))).status,403);assert.equal(rpcs.length,before);allowOrigin=true;
 actor=null;assert.equal((await POST(request({action:'exclude'}))).status,409);assert.equal(rpcs.length,before);
 console.log('PASS API exclude/skip/restore contract, current-campaign ownership, required optimistic revision, same-origin and signed-in checks');
})().catch(error=>{console.error(error);process.exitCode=1;});
