/* Real isolated sandbox DB, disposable fixtures only. No Stripe or email requests. */
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {createClient}=require('@supabase/supabase-js'),load=require('../scripts/fruitlife-test-load.cjs');
const c=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json','utf8'));
assert.equal(c.ref,'atemrshtshxoqnuevvqu');assert.equal(new URL(c.project_url).hostname,'atemrshtshxoqnuevvqu.supabase.co');
Object.assign(process.env,{NEXT_PUBLIC_DYDD_ENVIRONMENT:'sandbox',DYDD_BILLING_MODE:'test',NEXT_PUBLIC_DYDD_SANDBOX_SUPABASE_REF:c.ref,NEXT_PUBLIC_SUPABASE_URL:c.project_url,NEXT_PUBLIC_SUPABASE_ANON_KEY:c.anon_key});
const db=createClient(c.project_url,c.service_role_key,{auth:{persistSession:false,autoRefreshToken:false}});
const ok=r=>{assert(!r.error,r.error?.message);return r.data;},users=[],orders=[],snapshots=[];
const access=load('lib/commerce/account-access.ts',{'@/lib/supabase/admin':{createSupabaseAdminClient:()=>db},'next/navigation':{redirect:p=>{throw Error('redirect:'+p)}}});
const date=delta=>new Date(Date.now()+delta).toISOString();
(async()=>{try{
 const user=ok(await db.auth.admin.createUser({email:'personal-renewal-qa-'+crypto.randomUUID()+'@example.invalid',email_confirm:true})).user;users.push(user.id);
 const other=ok(await db.auth.admin.createUser({email:'personal-renewal-foreign-'+crypto.randomUUID()+'@example.invalid',email_confirm:true})).user;users.push(other.id);
 const snapshot=ok(await db.from('assessment_snapshots').insert({user_id:user.id,assessment_type:'designid',source:'sandbox_personal_membership_qa',scores:{synthetic:true},source_submitted_at:date(-100000)}).select('id').single());snapshots.push(snapshot.id);
 const course='designid-foundations',lesson=load('lib/passport/curriculum.ts').passportCurriculum.find(c=>c.slug===course).lessons[0].slug;
 ok(await db.from('passport_lesson_completions').insert({user_id:user.id,course_slug:course,lesson_slug:lesson}));
 async function grant(owner,capability,scope='account',end=date(100000)){
  const id=crypto.randomUUID();ok(await db.from('dydd_test_billing_orders').insert({id,user_id:owner.id,capability,scope_id:scope,price_id:'fixture',status:'paid'}));orders.push(id);
  ok(await db.rpc('dydd_test_save_entitlement',{p_order:id,p_source:id,p_active:true,p_paid:true,p_expires:capability==='designpd'?null:end,p_checked:date(0)}));return id;
 }
 const personal=await grant(user,'personal');
 assert.equal((await access.getPersonalMembershipState(user.id)).phase,'active');
 assert.equal((await access.getPersonalMembershipState(other.id)).phase,'untracked','foreign paid identity never inherits access');
 const dp=await grant(user,'designpd',snapshot.id);
 const before=ok(await db.from('passport_lesson_completions').select('*').eq('user_id',user.id));
 ok(await db.from('dydd_test_billing_entitlements').update({active:false,expires_at:date(-1),paid_through:date(-1)}).eq('source_id',personal));
 assert.equal((await access.getPersonalMembershipState(user.id)).phase,'expired');
 await assert.rejects(()=>access.requirePersonalMembershipContent(user,'/courses/designid-foundations'),/redirect:\/renew\?/);
 assert.equal(await access.signedInAccountDestination(user,'/hq'),'/renew?next=%2Fhq');
 assert.equal(await access.signedInAccountDestination(user,'/designpd?snapshot='+snapshot.id),'/designpd?snapshot='+snapshot.id,'purchased expansion remains directly reachable');
 // Failed renewal writes an unpaid future date; only the old paid history counts.
 ok(await db.rpc('dydd_test_save_entitlement',{p_order:personal,p_source:personal,p_active:false,p_paid:false,p_expires:date(100000),p_checked:date(0)}));
 assert.equal((await access.getPersonalMembershipState(user.id)).phase,'expired');
 // Renew the EXISTING order and authenticated identity; no account/profile replacement.
 ok(await db.rpc('dydd_test_save_entitlement',{p_order:personal,p_source:personal,p_active:true,p_paid:true,p_expires:date(100000),p_checked:date(0)}));
 assert.equal((await access.getPersonalMembershipState(user.id)).phase,'active');
 assert.equal(await access.signedInAccountDestination(user,'/renew?next=%2Fjourney'),'/journey');
 assert.deepEqual(ok(await db.from('passport_lesson_completions').select('*').eq('user_id',user.id)),before,'progress history unchanged across expiry and renewal');
 assert.equal(ok(await db.from('assessment_snapshots').select('id,user_id').eq('id',snapshot.id).single()).user_id,user.id,'assessment history stays on same account');
 assert.equal(ok(await db.auth.admin.getUserById(user.id)).user.id,user.id);
 assert(ok(await db.from('dydd_test_billing_entitlements').select('active').eq('source_id',dp).single()).active,'separate DesignPD purchase unchanged');
 ok(await db.from('dydd_test_billing_orders').update({status:'revoked'}).eq('id',personal));assert.equal((await access.getPersonalMembershipState(user.id)).phase,'expired','stale active entitlement cannot revive revoked purchase');
 console.log('PASS real sandbox DB: exclusive expiry, direct URL renewal gate, unpaid future invoice denied, same-order same-user renewal, exact progress and assessment history retained, separately paid DesignPD unchanged, foreign identity excluded, revoked order denied. No Stripe/email requests.');
 }finally{
 if(snapshots.length)ok(await db.from('assessment_snapshots').delete().in('id',snapshots));
 if(users.length)ok(await db.from('passport_lesson_completions').delete().in('user_id',users));
 if(orders.length){ok(await db.from('dydd_test_billing_entitlements').delete().in('order_id',orders));ok(await db.from('dydd_test_billing_orders').delete().in('id',orders));}
 for(const id of users)ok(await db.auth.admin.deleteUser(id));
 console.log('Cleaned all synthetic users, snapshots, progress and billing fixtures.');
 }})().catch(e=>{console.error(e);process.exitCode=1});
