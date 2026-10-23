const assert=require('node:assert/strict');
const load=require('../scripts/fruitlife-test-load.cjs');
let user=null,error=null;
const {supportAdmin}=load('lib/support/auth.ts',{'@/lib/supabase/server':{createSupabaseServerClient:async()=>({auth:{getUser:async()=>({data:{user},error})}})}});
(async()=>{assert.equal(await supportAdmin(),null);user={id:'learner',email:'learner@example.test',user_metadata:{admin:true}};assert.equal(await supportAdmin(),null);user={id:'owner',email:'dyddjourney@gmail.com'};assert.equal((await supportAdmin()).id,'owner');error={message:'expired'};assert.equal(await supportAdmin(),null);console.log('PASS real support authorization rejects anonymous, user metadata, and auth errors; allows existing admin email');})().catch(e=>{console.error(e);process.exitCode=1;});
