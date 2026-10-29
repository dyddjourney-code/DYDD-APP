const assert=require('node:assert/strict'),load=require('../scripts/fruitlife-test-load.cjs');
let sandbox=true,user=null,authError=null,authReads=0,adminReads=0;
process.env.DYDD_REVIEW_TOKEN='synthetic-private-owner-token';
const mocks={
 '@/lib/environment':{isSandbox:()=>sandbox},
 '@/lib/supabase/server':{createSupabaseServerClient:async()=>({auth:{getUser:async()=>{authReads++;return{data:{user},error:authError}}}})},
 '@/lib/supabase/admin':{createSupabaseAdminClient:()=>{adminReads++;throw Error('AUTHORIZED_READER_REACHED')}},
};
const {canReadAccounts}=load('lib/accounts/access.ts',mocks);
const {readAccountsDashboard}=load('lib/accounts/server.ts',mocks);
(async()=>{
 assert.equal(await canReadAccounts(),false);
 await assert.rejects(readAccountsDashboard(),/ACCOUNTS_FORBIDDEN/);assert.equal(adminReads,0);
 user={id:'synthetic',email:'unprivileged@example.invalid',user_metadata:{email:'dyddjourney@gmail.com',is_admin:true}};
 assert.equal(await canReadAccounts(),false,'editable metadata does not grant ownership');
 await assert.rejects(readAccountsDashboard({review:'owner',key:'wrong'}),/ACCOUNTS_FORBIDDEN/);assert.equal(adminReads,0);
 user={id:'owner',email:'dyddjourney@gmail.com'};assert.equal(await canReadAccounts(),true);
 authError={message:'expired'};assert.equal(await canReadAccounts(),false);authError=null;
 assert.equal(await canReadAccounts({review:'owner',key:process.env.DYDD_REVIEW_TOKEN}),true);
 await assert.rejects(readAccountsDashboard({review:'owner',key:process.env.DYDD_REVIEW_TOKEN}),/AUTHORIZED_READER_REACHED/);assert.equal(adminReads,1);
 sandbox=false;const oldReads=authReads;
 assert.equal(await canReadAccounts({review:'owner',key:process.env.DYDD_REVIEW_TOKEN}),false);assert.equal(authReads,oldReads);
 await assert.rejects(readAccountsDashboard(),/ACCOUNTS_FORBIDDEN/);assert.equal(adminReads,1,'production fails closed before privileged reader');
 const source=require('node:fs').readFileSync('lib/accounts/server.ts','utf8');
 assert(!/select\([^\n]*(scores|reportPayload|response|reflection)/.test(source));
 assert(source.includes("query.in('badge_key', allowedBadges)"),'exclude primary/secondary personal result badges at query');
 console.log('PASS backend authorization: anonymous, nonowner, metadata spoof, invalid preview, expired auth denied BEFORE admin read; existing owner email/preview accepted; production fail-closed; no score/reflection selectors.');
})().catch(e=>{console.error(e);process.exitCode=1});
