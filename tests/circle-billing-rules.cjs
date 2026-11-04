/* Real sandbox DB, synthetic evidence only. Never contacts Stripe or email providers. */
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {createClient}=require('@supabase/supabase-js'),load=require('../scripts/fruitlife-test-load.cjs');
const c=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));assert.equal(c.ref,'atemrshtshxoqnuevvqu');
Object.assign(process.env,{NEXT_PUBLIC_DYDD_ENVIRONMENT:'sandbox',NEXT_PUBLIC_DYDD_SANDBOX_SUPABASE_REF:c.ref,NEXT_PUBLIC_SUPABASE_URL:c.project_url,NEXT_PUBLIC_SUPABASE_ANON_KEY:c.anon_key,DYDD_BILLING_MODE:'test'});
const db=createClient(c.project_url,c.service_role_key,{auth:{persistSession:false}}),users=[],circles=[],orders=[];
const mocks={'@/lib/supabase/admin':{createSupabaseAdminClient:()=>db}};
const billing=load('lib/commerce/circle-billing.ts',mocks),ent=load('lib/commerce/test-entitlements.ts',mocks),{dc3PersonalCoupon}=load('lib/commerce/dc3.ts');
const check=r=>{assert(!r.error,r.error?.message);return r.data;};
const date=days=>new Date(Date.now()+days*86400000).toISOString();
async function user(){const u=check(await db.auth.admin.createUser({email:'billing-rules-'+crypto.randomUUID()+'@example.com',email_confirm:true})).user;users.push(u);return u;}
async function circle(u,format='Small Group',participants=[]){const id=crypto.randomUUID();check(await db.from('journey_circle_plans').insert({id,user_id:u.id,status:'active',plan:{name:'QA billing rules',format,participants}}));circles.push(id);return id;}
async function grant(u,capability,scope='account',paid=true){const id=crypto.randomUUID();check(await db.from('dydd_test_billing_orders').insert({id,user_id:u.id,capability,scope_id:scope,price_id:'fixture',status:'paid'}));orders.push(id);check(await db.rpc('dydd_test_save_entitlement',{p_order:id,p_source:id,p_active:true,p_paid:paid,p_expires:capability==='couples_circle'?null:date(10),p_checked:new Date().toISOString()}));return id;}
async function state(u,id,format='Small Group'){return billing.getCircleBillingState(u.id,id,format);}
(async()=>{try{
 const [leader,other,member,spouse,third]=await Promise.all([user(),user(),user(),user(),user()]);
 const id=await circle(leader);assert.equal((await state(leader,id)).phase,'unpaid');
 const lead=await grant(leader,'circle_leadership');assert.equal((await state(leader,id)).canOperate,false,'Leadership does not include Personal');
 await grant(leader,'personal');let s=await state(leader,id);assert.equal(s.phase,'active');assert(s.canCreate&&s.canEnroll&&s.canOperate);
 check(await db.from('dydd_test_billing_entitlements').update({active:false,paid_through:date(-1),expires_at:date(-1)}).eq('source_id',lead));
 s=await state(leader,id);assert.equal(s.phase,'transition');assert(!s.canCreate&&!s.canEnroll&&s.canOperate);
 for(const action of ['create','enroll']){await assert.rejects(()=>billing.requireCircleBillingAction(leader.id,id,'Small Group',action));assert((await db.rpc('dydd_circle_require_billing',{p_owner:leader.id,p_circle:id,p_format:'Small Group',p_action:action})).error);}
 check(await db.from('dydd_test_billing_entitlements').update({paid_through:date(-30.01)}).eq('source_id',lead));s=await state(leader,id);assert.equal(s.phase,'read_only');assert(!s.canOperate&&s.canRead);
 // Failed renewal cannot move a paid-through boundary into the unpaid future.
 check(await db.rpc('dydd_test_save_entitlement',{p_order:lead,p_source:lead,p_active:false,p_paid:false,p_expires:date(30),p_checked:new Date().toISOString()}));assert.equal((await state(leader,id)).phase,'read_only');
 check(await db.rpc('dydd_test_save_entitlement',{p_order:lead,p_source:lead,p_active:true,p_paid:true,p_expires:date(20),p_checked:new Date().toISOString()}));assert.equal((await state(leader,id)).phase,'active','Renewal restores tools');
 check(await db.rpc('dydd_test_save_entitlement',{p_order:lead,p_source:lead,p_active:false,p_paid:false,p_expires:date(20),p_checked:new Date().toISOString(),p_invalidated:true}));assert.equal((await state(leader,id)).canOperate,false,'Refund cannot leave paid-history grace');
 await assert.rejects(()=>state(other,id),'Billing cannot authorize foreign Circle');
 const couple=await circle(leader,'Couple',[{email:spouse.email}]);await billing.claimCoupleCircle(leader.id,couple);await grant(leader,'couples_circle',couple);assert.equal((await state(leader,couple,'Couple')).canOperate,true);assert.equal((await state(leader,couple,'Couple')).canCreate,false);
 check(await db.from('dydd_circle_memberships').insert({circle_id:couple,email:spouse.email,display_name:'Synthetic spouse',user_id:spouse.id,status:'accepted',token_hash:crypto.randomBytes(32).toString('hex'),expires_at:date(1),accepted_at:new Date().toISOString()}));assert.equal((await state(leader,couple,'Couple')).canOperate,false,'Accepted spouse must have separate Personal');await grant(spouse,'personal');assert.equal((await state(leader,couple,'Couple')).canOperate,true);
 const again=await circle(leader,'Couple',[{email:spouse.email}]);await assert.rejects(()=>billing.claimCoupleCircle(leader.id,again));
 const reverse=await circle(spouse,'Couple',[{email:leader.email}]);await assert.rejects(()=>billing.claimCoupleCircle(spouse.id,reverse),'Partner cannot repurchase second shared Circle');
 assert((await db.from('journey_circle_plans').update({plan:{name:'spoof',format:'Class',participants:[]}}).eq('id',couple)).error,'Cannot enlarge paid Couple');
 assert((await db.from('journey_circle_plans').update({plan:{name:'spoof',format:'Couple',participants:[{email:third.email}]}}).eq('id',couple)).error,'Cannot swap partner');
 check(await db.from('journey_circle_plans').delete().eq('id',couple));await assert.rejects(()=>billing.claimCoupleCircle(leader.id,again),'Delete does not reset binding');
 const a=await circle(leader,'Small Group',[{email:member.email}]),a2=await circle(leader,'Class',[{email:member.email}]),b=await circle(other,'Small Group',[{email:member.email}]);
 for(const [i,circle_id] of [a,a2,b].entries())check(await db.from('dydd_circle_memberships').insert({circle_id,email:member.email,display_name:'Synthetic member',user_id:member.id,status:'accepted',token_hash:crypto.randomBytes(32).toString('hex'),expires_at:date(1),accepted_at:new Date(Date.now()-100000+i*1000).toISOString()}));
 const mp=await grant(member,'personal');assert.equal(await ent.qualifyingTestParticipants(leader.id),1);assert.equal(await ent.qualifyingTestParticipants(other.id),0);
 check(await db.rpc('dydd_test_choose_credited_leader',{p_participant:member.id,p_leader:other.id}));
 assert.equal(await ent.qualifyingTestParticipants(leader.id),0);assert.equal(await ent.qualifyingTestParticipants(other.id),1,'Explicit choice overrides earliest and remains one leader');
 check(await db.rpc('dydd_test_choose_credited_leader',{p_participant:member.id,p_leader:null}));assert.equal(await ent.qualifyingTestParticipants(other.id),0,'Participant may opt out');
 assert((await db.rpc('dydd_test_choose_credited_leader',{p_participant:member.id,p_leader:spouse.id})).error,'Cannot credit unrelated leader');
 check(await db.rpc('dydd_test_choose_credited_leader',{p_participant:member.id,p_leader:other.id}));
 check(await db.from('dydd_circle_memberships').update({status:'left'}).eq('user_id',member.id).in('circle_id',[a,a2]));assert.equal(await ent.qualifyingTestParticipants(leader.id),0);assert.equal(await ent.qualifyingTestParticipants(other.id),1);
 check(await db.from('dydd_test_billing_entitlements').update({paid:false}).eq('source_id',mp));assert.equal(await ent.qualifyingTestParticipants(other.id),0,'Free grants/trials do not qualify');
 check(await db.from('dydd_test_billing_entitlements').update({paid:true,expires_at:date(-1)}).eq('source_id',mp));assert.equal(await ent.qualifyingTestParticipants(other.id),0,'Ended paid access does not qualify');
 const coupon={id:'dc3_fixture',livemode:false,valid:true,duration:'forever',percent_off:50,applies_to:{products:['prod_VZFrqe69t5RxtC']}};
 const stripe={coupons:{retrieve:async()=>coupon}};
 assert.equal(await dc3PersonalCoupon(stripe,'personal','dc3'),'dc3_fixture');for(const cap of ['circle_leadership','couples_circle','designpd'])await assert.rejects(()=>dc3PersonalCoupon(stripe,cap,'DC3'));
 coupon.applies_to.products.push('leadership');await assert.rejects(()=>dc3PersonalCoupon(stripe,'personal','DC3'),'Broad coupon refused');
 const anon=createClient(c.project_url,c.anon_key);assert((await anon.rpc('dydd_circle_billing_state',{p_owner:leader.id,p_circle:id,p_format:'Small Group'})).error);
 console.log('PASS real isolated DB: separate Personal, renewal restoration, transition restrictions, read-only boundary, failed renewal and refunds, foreign ownership, persistent Couples scope/delete/reverse-payer/partner lock, unique paid attribution, ended/free exclusions, DC3 Personal-only restricted coupon, anon denial. No Stripe purchase/send.');
 }finally{
 if(circles.length)check(await db.from('journey_circle_plans').delete().in('id',circles));
 if(orders.length){check(await db.from('dydd_test_billing_entitlements').delete().in('order_id',orders));check(await db.from('dydd_test_billing_orders').delete().in('id',orders));}
 for(const u of users)check(await db.auth.admin.deleteUser(u.id));
 console.log('Synthetic billing fixtures removed.');
 }})().catch(e=>{console.error(e);process.exitCode=1;});
