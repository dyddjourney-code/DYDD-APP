// One-time sandbox-only refresh of pristine, unapproved generated copy.
// Authored edits, approvals, submitted/accepted history and other projects are untouched.
import fs from 'node:fs';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';import {createRequire} from 'node:module';import {createClient} from '@supabase/supabase-js';
const require=createRequire(import.meta.url),load=require('./fruitlife-test-load.cjs');
const c=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));
if(c.ref!=='atemrshtshxoqnuevvqu'||new URL(c.project_url).hostname!=='atemrshtshxoqnuevvqu.supabase.co')throw Error('Sandbox target mismatch');
const db=createClient(c.project_url,c.service_role_key,{auth:{persistSession:false}}),ok=r=>{if(r.error)throw Error(r.error.message);return r.data;};
const oldPath='tmp/circle-generator-before-simplification.ts';fs.writeFileSync(oldPath,execFileSync('git',['show','3bd7c10:lib/lifecycle/templates.ts'],{encoding:'utf8'}));
const oldGenerate=load(oldPath,{'server-only':{}}).circleMessageDrafts,newGenerate=load('lib/lifecycle/templates.ts',{'server-only':{}}).circleMessageDrafts;
const apply=process.argv.includes('--apply'),report={sandbox:true,apply,updated:0,omitted:0,preserved:0,conflicts:0,campaigns:0};
for(const campaign of ok(await db.from('dydd_circle_campaigns').select('*').eq('status','draft'))){
 const circle=ok(await db.from('journey_circle_plans').select('id,user_id,preview_scope,revision,status').eq('id',campaign.circle_id).maybeSingle());if(!circle||circle.status!=='active'||circle.revision!==campaign.circle_revision)continue;
 const drafts=ok(await db.from('dydd_circle_message_drafts').select('*').eq('campaign_id',campaign.id));if(!drafts.length)continue;report.campaigns++;
 const base=drafts.map(d=>d.body.match(/https?:\/\/[^\s/]+(?=\/journey)/)?.[0]).find(Boolean);if(!base)continue;
 const changed=drafts.some(d=>d.message_key==='schedule-change'),at=new Date(campaign.created_at),oldRows=new Map(oldGenerate(campaign.plan_snapshot,base,changed,at).map(d=>[d.message_key,d])),newRows=new Map(newGenerate(campaign.plan_snapshot,base,changed,at).map(d=>[d.message_key,d]));
 for(const draft of drafts){
  const old=oldRows.get(draft.message_key),next=newRows.get(draft.message_key);
  if(!old||draft.revision!==1||draft.approved_at||draft.excluded_at||draft.subject!==old.subject||draft.body!==old.body){report.preserved++;continue;}
  const history=ok(await db.from('dydd_lifecycle_jobs').select('id').eq('draft_id',draft.id).or('send_authorized_at.not.is.null,provider_id.not.is.null,status.in.(submitting,accepted,review)'));
  if(history.length){report.preserved++;continue;}
  if(next&&next.subject===draft.subject&&next.body===draft.body)continue;
  if(!apply){next?report.updated++:report.omitted++;continue;}
  const result=next?await db.rpc('dydd_update_circle_message',{message_id:draft.id,actor_user:circle.user_id,actor_scope:circle.preview_scope,expected_revision:1,new_subject:next.subject,new_body:next.body,approve:false}):await db.rpc('dydd_set_circle_message_excluded',{message_id:draft.id,actor_user:circle.user_id,actor_scope:circle.preview_scope,expected_revision:1,exclude:true});
  if(result.error){report.conflicts++;continue;}next?report.updated++:report.omitted++;
 }
}
fs.writeFileSync('tmp/circle-generated-refresh-proof.json',JSON.stringify({...report,checkedAt:new Date().toISOString(),baseline:'3bd7c10',scriptSha256:crypto.createHash('sha256').update(fs.readFileSync(import.meta.filename)).digest('hex')},null,2));console.log(JSON.stringify(report));
