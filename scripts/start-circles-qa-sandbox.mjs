// Local-only QA runtime; do not deploy this launcher or change hosted owner identity.
import fs from 'node:fs';import {spawn} from 'node:child_process';
const c=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));
if(c.ref!=='atemrshtshxoqnuevvqu')throw Error('Sandbox required');
process.loadEnvFile('.env.local');
Object.assign(process.env,{NODE_ENV:'development',NEXT_PUBLIC_DYDD_ENVIRONMENT:'sandbox',NEXT_PUBLIC_DYDD_SANDBOX_SUPABASE_REF:c.ref,NEXT_PUBLIC_SUPABASE_URL:c.project_url,NEXT_PUBLIC_SUPABASE_ANON_KEY:c.anon_key,SUPABASE_SERVICE_ROLE_KEY:c.service_role_key,DYDD_BILLING_MODE:'test',DYDD_TEST_APP_URL:'http://localhost:3138',DYDD_APP_URL:'http://localhost:3138',DYDD_ADMIN_EMAILS:'circles-qa-owner@example.com'});
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--webpack','--hostname','127.0.0.1','--port','3138'],{stdio:'inherit',env:process.env});
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>child.kill(signal));child.on('exit',code=>process.exit(code||0));
