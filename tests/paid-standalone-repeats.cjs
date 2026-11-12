const {test}=require('node:test'),assert=require('node:assert/strict');
function harness({completed=false,email='same@example.test',current=true,paused=false}={}){
 delete require.cache[require.resolve('../scripts/fruitlife-test-load.cjs')];const load=require('../scripts/fruitlife-test-load.cjs');
 const prior={id:'prior',participant_email:email},fresh={id:'fresh',participant_email:'same@example.test'};let writes=0,chosen;
 const action=load('app/assessments/guest-actions.ts',{
  'next/navigation':{redirect:url=>{throw Error('REDIRECT '+url)}},
  'next/headers':{cookies:async()=>({get:()=>current?{value:'prior'}:undefined,set:()=>{}})},
  '@/lib/public-assessments/guest-capability':{newGuestCapability:()=> 'new-private-token',guestCapabilityHash:()=> 'hash',guestSessionPath:id=>'/assessments/session/'+id},
  '@/lib/public-assessments/payments':{publicPaymentConfiguration:()=>{if(paused)throw Error('paused')}},
  '@/lib/public-assessments/guest':{requireGuest:async()=>({session:prior,token:'private-token'}),guestRecords:async()=>({results:completed?[{product:'designid',created_at:new Date().toISOString()}]:[]}),rememberGuest:async()=>{}},
  '@/lib/public-assessments/guest-payments':{createGuestCheckout:async(session)=>{chosen=session.id;return 'https://checkout.invalid/'+session.id}},
  '@/lib/public-assessments/guest-results':{},'@/lib/public-assessments/guest-reports':{},
  '@/lib/supabase/admin':{createSupabaseAdminClient:()=>({from:()=>({insert(){writes++;return this},select(){return this},single:async()=>({data:fresh})})})}
 });const form=new FormData();form.set('name','Test Person');form.set('email','same@example.test');
 return {run:()=>action.startGuestDesignId(form),stats:()=>({writes,chosen})};
}
test('recent completed report creates a separate payable session; no cooldown',async()=>{const h=harness({completed:true});await assert.rejects(h.run(),/checkout.invalid\/fresh/);assert.deepEqual(h.stats(),{writes:1,chosen:'fresh'})});
test('unfinished same-browser purchase resumes exact session, not a second charge',async()=>{const h=harness();await assert.rejects(h.run(),/checkout.invalid\/prior/);assert.deepEqual(h.stats(),{writes:0,chosen:'prior'})});
test('typed email never reveals another guest capability',async()=>{const h=harness({email:'other@example.test'});await assert.rejects(h.run(),/checkout.invalid\/fresh/);assert.equal(h.stats().chosen,'fresh')});
test('paused sales fail before creating a session or checkout',async()=>{const h=harness({paused:true});await assert.rejects(h.run(),/paused/);assert.deepEqual(h.stats(),{writes:0,chosen:undefined})});
