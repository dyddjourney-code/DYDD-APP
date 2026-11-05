// Local QA launcher; exact isolated DB, transports off. Never a hosted entry point.
import fs from 'node:fs';import {spawn} from 'node:child_process';
const c=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json','utf8'));
if(c.ref!=='atemrshtshxoqnuevvqu'||c.vercel.projectId!=='prj_5EC6sfJe9DpGYW59L94iwppeMYUg')throw Error('Sandbox only');
process.loadEnvFile('.env.local');
Object.assign(process.env,{NODE_ENV:'development',NEXT_PUBLIC_DYDD_ENVIRONMENT:'sandbox',NEXT_PUBLIC_DYDD_SANDBOX_SUPABASE_REF:c.ref,NEXT_PUBLIC_SUPABASE_URL:c.project_url,NEXT_PUBLIC_SUPABASE_ANON_KEY:c.anon_key,SUPABASE_SERVICE_ROLE_KEY:c.service_role_key,DYDD_BILLING_MODE:'test',DYDD_APP_URL:'http://localhost:3147',DYDD_TEST_APP_URL:'http://localhost:3147',DYDD_SANDBOX_EMAIL_ENABLED:'false',DYDD_SANDBOX_AUTH_EMAIL_ENABLED:'false',DYDD_REVIEW_TOKEN:c.review_token});
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--webpack','--hostname','127.0.0.1','--port','3147'],{env:process.env,stdio:'inherit'});
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>child.kill(signal));child.on('exit',code=>process.exit(code||0));
