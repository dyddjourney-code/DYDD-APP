const assert=require('node:assert/strict'),load=require('../scripts/fruitlife-test-load.cjs');
const {sandboxRecipientAllowed:allowed,sandboxTransportBlocked:blocked,sandboxJobTransportBlocked:jobBlocked}=load('lib/email/sandbox-policy.ts');
const env={...process.env};
try{
 Object.assign(process.env,{NEXT_PUBLIC_DYDD_ENVIRONMENT:'sandbox',NEXT_PUBLIC_DYDD_SANDBOX_SUPABASE_REF:'atemrshtshxoqnuevvqu',NEXT_PUBLIC_SUPABASE_URL:'https://atemrshtshxoqnuevvqu.supabase.co',DYDD_SANDBOX_EMAIL_ALLOWLIST:'john@example.test',DYDD_SANDBOX_EMAIL_ENABLED:'true',DYDD_SANDBOX_EMAIL_ACTIVATED_AT:'2026-11-04T20:00:00Z'});
 assert(allowed(' John@Example.test '));assert(!blocked('john@example.test'));assert(blocked('john+test@example.test'));assert(blocked('other@example.test'));assert(blocked('john@example.test,other@example.test'));assert(jobBlocked('john@example.test','2026-11-04T19:59:59Z'));assert(!jobBlocked('john@example.test','2026-11-04T20:00:01Z'));assert(jobBlocked('other@example.test','2026-11-04T20:00:01Z'));
 process.env.DYDD_SANDBOX_EMAIL_ACTIVATED_AT='invalid';assert(jobBlocked('john@example.test',new Date().toISOString()));
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://laojrzlqbkmirzcbcnyw.supabase.co';assert(blocked('john@example.test'));
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://atemrshtshxoqnuevvqu.supabase.co';delete process.env.DYDD_SANDBOX_EMAIL_ENABLED;assert(blocked('john@example.test'));
 process.env.DYDD_SANDBOX_EMAIL_ENABLED='true';process.env.DYDD_SANDBOX_EMAIL_ALLOWLIST='*@example.test';assert(blocked('john@example.test'));
 process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT='production';assert(!blocked('any@example.test'));assert(!jobBlocked('any@example.test','invalid'));assert(!allowed('john@example.test'));
 console.log('PASS 15 exact recipient, wildcard/plus/header injection, explicit activation, isolated ref/URL, no backlog, default-off and production preservation assertions');
}finally{for(const k of Object.keys(process.env))if(!(k in env))delete process.env[k];Object.assign(process.env,env);}
