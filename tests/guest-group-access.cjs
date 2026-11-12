const {test}=require('node:test');const assert=require('node:assert/strict');
const load=require('../scripts/fruitlife-test-load.cjs');
const capability=load('lib/public-assessments/guest-capability.ts');
function harness({enabled=true,data=null,error=null}={}) {
 delete require.cache[require.resolve('../scripts/fruitlife-test-load.cjs')];
 const load=require('../scripts/fruitlife-test-load.cjs');
 let calls=[];
 const db={from:()=>({select(){return this},eq(k,v){calls.push([k,v]);return this},async maybeSingle(){return {data,error}}}),async rpc(name,args){calls.push({name,args});return {data,error}}};
 const m=load('lib/public-assessments/guest-group-access.ts',{'@/lib/supabase/admin':{createSupabaseAdminClient:()=>db},'./config':{publicAssessmentLedgerEnabled:()=>enabled}});
 return {m,calls};
}
const input={name:'Owner supplied fixture',kind:'group',couponCode:'',products:['designid','designpd'],expiresAt:'2030-01-01T00:00:00Z',maxUses:'2'};
test('owner inputs require explicit bounded products, name, expiry and limit; coupon provenance retained',()=>{
 const {m}=harness();assert.equal(m.validateGuestGrant(input).max_uses,2);
 for(const patch of [{name:''},{maxUses:''},{maxUses:'0'},{maxUses:'1.1'},{maxUses:'2147483648'},{expiresAt:'invalid'},{expiresAt:'2020-01-01'},{products:[]},{products:['course']},{kind:'coupon'}])assert.throws(()=>m.validateGuestGrant({...input,...patch}));
 const coupon=m.validateGuestGrant({...input,kind:'coupon',couponCode:' OWN-CODE ',products:['designid','designid']});assert.equal(coupon.coupon_code,'OWN-CODE');assert.deepEqual(coupon.products,['designid']);
});
test('unknown/malformed tokens and unavailable ledger fail closed',async()=>{
 const token=capability.newGuestCapability();await assert.rejects(harness().m.readGuestGrant(token),/unavailable/);
 await assert.rejects(harness().m.readGuestGrant('not-a-token'),/Invalid recovery/);
 await assert.rejects(harness({enabled:false}).m.redeemGuestGrant('00000000-0000-4000-8000-000000000001',token),/temporarily unavailable/);
 await assert.rejects(harness({data:{revoked_at:'2026-11-01'}}).m.readGuestGrant(token),/unavailable/);
});
test('redemption sends hashed capability only to atomic service RPC, never price or free flag',async()=>{
 const token=capability.newGuestCapability(),session='00000000-0000-4000-8000-000000000001',source='00000000-0000-4000-8000-000000000002';
 const {m,calls}=harness({data:['fixture-order']});assert.deepEqual(await m.redeemGuestGrant(session,token,source),['fixture-order']);
 assert.deepEqual(calls,[{name:'dydd_guest_redeem_access',args:{p_session_id:session,p_token_hash:capability.guestCapabilityHash(token),p_source:source}}]);assert.ok(!JSON.stringify(calls).includes(token));
});
test('recovery/timing failures are specific and other storage failures disclose no data',async()=>{
 const token=capability.newGuestCapability(),session='00000000-0000-4000-8000-000000000001';
 await assert.rejects(harness({error:{message:'Assessment timing needs recovery'}}).m.redeemGuestGrant(session,token),/six months/);
 await assert.rejects(harness({error:{message:'private DB diagnostics'}}).m.redeemGuestGrant(session,token),/unavailable, expired, or fully used/);
});
function ownerHarness(user,admin=true) {
 delete require.cache[require.resolve('../scripts/fruitlife-test-load.cjs')];const load=require('../scripts/fruitlife-test-load.cjs');
 let stored;const grant=load('lib/public-assessments/guest-group-access.ts',{'./config':{publicAssessmentLedgerEnabled:()=>true}});
 const actions=load('app/owner/guest-access/actions.ts',{
  'next/navigation':{redirect:target=>{throw Error('REDIRECT '+target)}},'next/cache':{revalidatePath:()=>{}},
  '@/lib/admin-access':{isDyddAdminEmail:()=>admin},'@/lib/supabase/server':{createSupabaseServerClient:async()=>({auth:{getUser:async()=>({data:{user},error:null})}})},
  '@/lib/public-assessments/guest-group-access':grant,
  '@/lib/supabase/admin':{createSupabaseAdminClient:()=>({from:()=>({insert(row){stored=row;return this},select(){return this},async single(){return {data:{id:'fixture-grant'}}}})})}
 });return {actions,stored:()=>stored};
}
test('owner creation rejects unauthenticated, unconfirmed, and non-admin actors',async()=>{
 for(const [user,admin] of [[null,true],[{id:'actor',email:'owner@example.test'},true],[{id:'actor',email:'owner@example.test',email_confirmed_at:'2026-11-01'},false]]){
  const h=ownerHarness(user,admin);await assert.rejects(h.actions.requireGuestAccessOwner(),/REDIRECT|Only the DYDD owner/);assert.equal(h.stored(),undefined);
 }
});
test('confirmed owner creates only explicit bounds; stores hash and returns link once',async()=>{
 const h=ownerHarness({id:'actor',email:'owner@example.test',email_confirmed_at:'2026-11-01'}),form=new FormData();
 for(const [key,value] of Object.entries({name:'Owner fixture',kind:'coupon',coupon_code:'OWNER-TEST',expires_at:'2030-01-01T00:00',max_uses:'3',products:'designid'}))form.set(key,value);
 const result=await h.actions.createGuestAccessGrant({message:''},form);assert.ok(result.link,result.message);
 const raw=new URL(result.link,'https://fixture.invalid').searchParams.get('key'),row=h.stored();
 assert.equal(row.token_hash,capability.guestCapabilityHash(raw));assert.equal(row.created_by,'actor');assert.equal(row.max_uses,3);assert.equal(row.expires_at,'2030-01-01T00:00:00.000Z');assert.equal(row.coupon_code,'OWNER-TEST');assert.ok(!JSON.stringify(row).includes(raw));
});
