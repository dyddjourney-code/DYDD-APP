const {test}=require('node:test');
const assert=require('node:assert/strict');
function fresh(){delete require.cache[require.resolve('../scripts/fruitlife-test-load.cjs')];return require('../scripts/fruitlife-test-load.cjs');}
const grantId='00000000-0000-4000-8000-000000000001',requestId='00000000-0000-4000-8000-000000000002';
function helpers(){const load=fresh();return {load,helper:load('lib/public-assessments/individual-guest-access.ts')};}
test('Eastern expiry uses selected date end-of-day across winter, summer and both DST transitions',()=>{
 const {helper:h}=helpers(),past=Date.parse('2020-01-01');
 for(const [date,expected] of [['2030-01-15','2030-01-16T04:59:59.999Z'],['2030-07-15','2030-07-16T03:59:59.999Z'],['2026-03-08','2026-03-09T03:59:59.999Z'],['2026-11-01','2026-11-02T04:59:59.999Z']])assert.equal(h.individualGuestDeadline(date,past),expected);
 for(const date of ['2026-02-29','2030-02-30','invalid','2030-01-01T00:00','1999-12-31'])assert.throws(()=>h.individualGuestDeadline(date,past));
 assert.throws(()=>h.individualGuestDeadline('2026-11-12',Date.parse('2026-11-13T05:00Z')),/future/);
 assert.equal(h.individualGuestDeadline('2026-11-12',Date.parse('2026-11-13T04:59Z')),'2026-11-13T04:59:59.999Z');
 assert.match(h.formatGuestDeadline('2030-07-16T03:59:59.999Z'),/July 15, 2030 at 11:59 p.m. Eastern Time/);
});
test('individual creation ignores caller limits/coupon and requires exact bounded recipient and products',()=>{
 const {load}=helpers();const m=load('lib/public-assessments/guest-group-access.ts',{'./config':{publicAssessmentLedgerEnabled:()=>true}});
 const input={name:'',kind:'individual',couponCode:'UNTRUSTED',products:['designpd','designpd'],expiresAt:'2030-07-15',maxUses:'999',recipientEmail:' Guest+tag@Example.test ',recipientName:' A '};
 const result=m.validateGuestGrant(input);assert.equal(result.max_uses,1);assert.equal(result.recipient_email,'guest+tag@example.test');assert.equal(result.recipient_name,'A');assert.deepEqual(result.products,['designpd']);assert.equal(result.coupon_code,null);assert.ok(result.name.length>=2);
 for(const patch of [{recipientEmail:''},{recipientEmail:'a@@example.test'},{recipientEmail:'a\nb@example.test'},{recipientName:'a\nb'},{recipientName:'x'.repeat(121)},{products:[]},{products:['course']}])assert.throws(()=>m.validateGuestGrant({...input,...patch}));
 assert.equal(m.validateGuestGrant({...input,recipientName:''}).recipient_name,null);
});
test('retrievable individual capability is grant-scoped HMAC and fails closed without existing secret',()=>{
 const {helper:h}=helpers(),prior=process.env.SUPABASE_SERVICE_ROLE_KEY;
 try{process.env.SUPABASE_SERVICE_ROLE_KEY='synthetic-not-a-real-secret';const token=h.individualGuestToken(grantId);assert.match(token,/^[A-Za-z0-9_-]{43}$/);assert.equal(token,h.individualGuestToken(grantId));assert.notEqual(token,h.individualGuestToken(requestId));delete process.env.SUPABASE_SERVICE_ROLE_KEY;assert.throws(()=>h.individualGuestToken(grantId),/configuration/);}finally{if(prior===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;else process.env.SUPABASE_SERVICE_ROLE_KEY=prior;}
});
function invitationHarness(patch={},error=null){
 const {load,helper}=helpers();let data;
 const db={from(){return {select(){return this},eq(){return this},async maybeSingle(){return {data,error}}}}};
 const module=load('lib/public-assessments/guest-invitation.ts',{'@/lib/supabase/admin':{createSupabaseAdminClient:()=>db},'./config':{publicAssessmentLedgerEnabled:()=>true}});
 const grant={id:grantId,name:'Individual guest pass',kind:'individual',recipient_email:'guest@example.test',recipient_name:'<Guest>',products:['designid','designpd'],expires_at:'2030-07-16T03:59:59.999Z',invitation_job_id:requestId,revoked_at:null,...patch};
 const token=helper.individualGuestToken(grantId);data={...grant,token_hash:require('node:crypto').createHash('sha256').update(token).digest('hex')};
 const rendered=module.renderGuestInvitation(grant,helper.guestGrantLink(token)),key=module.guestInvitationKey(grantId,requestId);
 return {module,rendered,grant,job:{email:grant.recipient_email,event_key:'application:'+key,context:{deliveryContext:{type:'guest_invitation',guestGrantId:grantId,invitationRequestId:requestId},senderInput:{...rendered,to:grant.recipient_email,idempotencyKey:key}}}};
}
test('invitation has start CTA, exact products/deadline, safe HTML and no subscription language',()=>{
 const saved=process.env.SUPABASE_SERVICE_ROLE_KEY;process.env.SUPABASE_SERVICE_ROLE_KEY='synthetic-invite-secret';
 try{const {rendered:r}=invitationHarness();assert.match(r.text,/DesignID and DesignPD/);assert.match(r.text,/July 15, 2030 at 11:59 p.m. Eastern Time/);assert.match(r.text,/Start your assessment: https:\/\//);assert.match(r.text,/DesignPD requires your completed DesignID/);assert.match(r.text,/even if you start earlier/);assert.doesNotMatch(r.text,/subscription|subscribe|unsubscribe|trial|renewal/i);assert.match(r.html,/&lt;Guest&gt;/);assert.doesNotMatch(r.html,/<Guest>/);}finally{if(saved===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;else process.env.SUPABASE_SERVICE_ROLE_KEY=saved;}
});
test('immediate and retry eligibility bind recipient, request, content and deadline; revoked/expired fail closed',async()=>{
 const oldSecret=process.env.SUPABASE_SERVICE_ROLE_KEY,oldEnabled=process.env.DYDD_GUEST_EMAIL_ENABLED;process.env.SUPABASE_SERVICE_ROLE_KEY='synthetic-invite-secret';process.env.DYDD_GUEST_EMAIL_ENABLED='true';
 try{
  const h=invitationHarness();assert.deepEqual(await h.module.guestInvitationDeliveryEligibility(h.job),{});
  for(const patch of [{revoked_at:'2026-11-12'},{expires_at:'2026-01-01T00:00:00Z'},{kind:'group'},{invitation_job_id:grantId}]){const x=invitationHarness(patch);assert.ok((await x.module.guestInvitationDeliveryEligibility(x.job)).stop);}
  const other=structuredClone(h.job);other.email='other@example.test';assert.ok((await h.module.guestInvitationDeliveryEligibility(other)).stop);
  const altered=structuredClone(h.job);altered.context.senderInput.text+=' extra';assert.ok((await h.module.guestInvitationDeliveryEligibility(altered)).stop);
  const badkey=structuredClone(h.job);badkey.event_key+='x';assert.ok((await h.module.guestInvitationDeliveryEligibility(badkey)).stop);
  const failure=invitationHarness({}, {message:'storage down'});await assert.rejects(failure.module.guestInvitationDeliveryEligibility(failure.job),/storage/);
  process.env.DYDD_GUEST_EMAIL_ENABLED='false';assert.ok((await h.module.guestInvitationDeliveryEligibility(h.job)).deferUntil);
 }finally{for(const [key,val] of [['SUPABASE_SERVICE_ROLE_KEY',oldSecret],['DYDD_GUEST_EMAIL_ENABLED',oldEnabled]])if(val===undefined)delete process.env[key];else process.env[key]=val;}
});
function actionHarness({user={id:'owner',email:'owner@example.test',email_confirmed_at:'2026-11-12'},admin=true,grantPatch={},priorStatus='accepted'}={}){
 const load=fresh(),sent=[],writes=[];
 const helper=load('lib/public-assessments/individual-guest-access.ts');
 let grant={id:grantId,name:'Guest pass',kind:'individual',recipient_email:'guest@example.test',recipient_name:null,products:['designid','designpd'],expires_at:'2030-07-16T03:59:59.999Z',invitation_job_id:null,revoked_at:null,...grantPatch};
 grant.token_hash=require('node:crypto').createHash('sha256').update(helper.individualGuestToken(grantId)).digest('hex');
 const db={from(table){let update=null;return {select(){return this},eq(){return this},is(){return this},gt(){return this},insert(row){writes.push(row);return this},update(row){update=row;writes.push(row);return this},async single(){return {data:grant,error:null}},async maybeSingle(){return {data:table==='dydd_lifecycle_jobs'?{status:priorStatus}:{id:grantId},error:null}},then(resolve){return Promise.resolve({data:[],error:null}).then(resolve)}}}};
 const module=load('app/owner/guest-access/actions.ts',{'next/navigation':{redirect:()=>{throw Error('Not authenticated')}},'next/cache':{revalidatePath:()=>{}},'@/lib/admin-access':{isDyddAdminEmail:()=>admin},'@/lib/supabase/server':{createSupabaseServerClient:async()=>({auth:{getUser:async()=>({data:{user}})}})},'@/lib/supabase/admin':{createSupabaseAdminClient:()=>db},'@/lib/public-assessments/guest-group-access':{requireGuestAccessStorage:()=>{},validateGuestGrant:input=>({kind:'individual',name:'Individual guest pass',max_uses:1,recipient_email:input.recipientEmail,recipient_name:null,products:input.products,expires_at:'2030-07-16T03:59:59.999Z'})},'@/lib/lifecycle/application-mail':{sendApplicationEmail:async input=>{sent.push(input);return {sent:true,skipped:false}}}});
 const form=new FormData();form.set('grant_id',grantId);form.set('request_id',requestId);
 return {module,sent,writes,form};
}
test('creation stores hashed individual link and never sends an invitation',async()=>{
 const old=process.env.SUPABASE_SERVICE_ROLE_KEY;process.env.SUPABASE_SERVICE_ROLE_KEY='synthetic-action-secret';
 try{const h=actionHarness(),form=new FormData();form.set('kind','individual');form.set('recipient_email','guest@example.test');form.set('products','designid');const state=await h.module.createGuestAccessGrant({message:''},form);assert.ok(state.link,state.message);assert.match(state.message,/No email has been sent/);assert.equal(h.sent.length,0);const token=new URL(state.link).searchParams.get('key');assert.equal(h.writes[0].token_hash,require('node:crypto').createHash('sha256').update(token).digest('hex'));assert.ok(!JSON.stringify(h.writes[0]).includes(token));}finally{if(old===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;else process.env.SUPABASE_SERVICE_ROLE_KEY=old;}
});
test('owner send uses durable pipeline and same deadline/link on resend; pending delivery reuses original key',async()=>{
 const old=process.env.SUPABASE_SERVICE_ROLE_KEY;process.env.SUPABASE_SERVICE_ROLE_KEY='synthetic-action-secret';
 try{const first=actionHarness();assert.match((await first.module.sendGuestAccessInvitation({message:''},first.form)).message,/accepted/);assert.equal(first.sent.length,1);assert.equal(first.sent[0].to,'guest@example.test');assert.equal(first.sent[0].deliveryContext.type,'guest_invitation');
  const pending=actionHarness({grantPatch:{invitation_job_id:grantId},priorStatus:'retry'});await pending.module.sendGuestAccessInvitation({message:''},pending.form);assert.equal(pending.sent[0].idempotencyKey,'guest-invitation-'+grantId+'-'+grantId);assert.equal(pending.sent[0].text,first.sent[0].text);assert.equal(pending.sent[0].html,first.sent[0].html);
  for(const options of [{grantPatch:{kind:'group'}},{grantPatch:{revoked_at:'2026-11-12'}},{grantPatch:{expires_at:'2020-01-01T00:00Z'}}]){const denied=actionHarness(options);await denied.module.sendGuestAccessInvitation({message:''},denied.form);assert.equal(denied.sent.length,0);}
  for(const options of [{user:null},{admin:false}]){const denied=actionHarness(options);await assert.rejects(denied.module.sendGuestAccessInvitation({message:''},denied.form));assert.equal(denied.sent.length,0);}
 }finally{if(old===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;else process.env.SUPABASE_SERVICE_ROLE_KEY=old;}
});
test('individual guest entry rejects a different email before any session allocation; optional name works',async()=>{
 for(const email of ['other@example.test',' INVITED@example.test ']){
  const load=fresh(),allocated=[],redeemed=[],cookies=[];
  const jar={get:()=>undefined,getAll:()=>[],set:(...args)=>cookies.push(args)};
  const actions=load('app/assessments/group/actions.ts',{'next/navigation':{redirect:target=>{throw Error('REDIRECT '+target)}},'next/headers':{cookies:async()=>jar},'@/lib/public-assessments/guest-group-access':{readGuestGrant:async()=>({kind:'individual',recipient_email:'invited@example.test',recipient_name:null,products:['designid']}),redeemGuestGrant:async(...args)=>redeemed.push(args),guestGrantCookie:id=>'grant_'+id},'@/lib/public-assessments/guest':{rememberGuest:async()=>{},requireGuest:async()=>{throw Error('No session')},guestRecords:async()=>({results:[]})},'@/lib/supabase/admin':{createSupabaseAdminClient:()=>({from:()=>({insert(row){allocated.push(row);return this},select(){return this},async single(){return {data:{id:grantId}}}})})}});
  const form=new FormData();form.set('key','a'.repeat(43));form.set('email',email);
  let target;try{await actions.enrollGuestAccess(form);}catch(error){target=error.message;}
  if(email==='other@example.test'){assert.equal(allocated.length,0);assert.equal(redeemed.length,0);assert.match(target,/exact\+recipient\+email/);}
  else {assert.equal(allocated.length,1);assert.equal(allocated[0].participant_name,'Guest');assert.equal(allocated[0].participant_email,'invited@example.test');assert.equal(redeemed.length,1);assert.match(target,/\/assessments\/session\//);}
 }
});
