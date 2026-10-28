// Reconcile only future authored releases. This script intentionally cannot backfill an archive.
import fs from 'node:fs';import {createClient} from '@supabase/supabase-js';
const c=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));if(c.ref!=='atemrshtshxoqnuevvqu')throw Error('Sandbox only');
const db=createClient(c.project_url,c.service_role_key,{auth:{persistSession:false}}),ok=r=>{if(r.error)throw Error(r.error.message);return r.data;};
const settings=ok(await db.from('dydd_lifecycle_settings').select('activated_at').eq('id',true).single()),all=JSON.parse(fs.readFileSync('lib/waypoints/waypoints.json'));
const future=all.filter(w=>Date.parse(w.releaseAt)>Math.max(Date.now(),Date.parse(settings.activated_at)));
const before={ref:c.ref,createdAt:new Date().toISOString(),waypoints:ok(await db.from('dydd_waypoints').select('*').in('slug',future.map(w=>w.id))),releases:ok(await db.from('dydd_waypoint_releases').select('*').gte('release_at',settings.activated_at))};
fs.writeFileSync('tmp/email-circle-waypoints-before.json',JSON.stringify(before,null,2),{mode:0o600});
for(const w of future){
 const row=ok(await db.from('dydd_waypoints').upsert({slug:w.id,title:w.title,category:w.category,scripture_reference:w.scripture,base_content:w.body.join('\n\n'),base_reflection_prompt:w.reflection,public_cta:'Pause, pray, and carry one faithful step into the week.',tags:w.tags,source:'DYDD approved app Waypoints',status:'published',metadata:{display_date:w.date,excerpt:w.excerpt,authored_waypoint_id:w.id,scripture_text:w.scriptureText,scripture_translation:w.scriptureTranslation,scripture_attribution:w.scriptureAttribution,reflections:w.reflections}},{onConflict:'slug'}).select('id').single());
 const existing=ok(await db.from('dydd_waypoint_releases').select('id,status').eq('waypoint_id',row.id).eq('release_at',w.releaseAt).maybeSingle());
 if(existing&&existing.status!=='scheduled')throw Error('A future release is already released; reconcile acceptance before changing it.');
 if(!existing)ok(await db.from('dydd_waypoint_releases').insert({waypoint_id:row.id,release_at:w.releaseAt,release_timezone:'America/New_York',status:'scheduled',public_channels:['website'],subscriber_channels:['email','app'],metadata:{display_date:w.date,authored_waypoint_id:w.id}}));
}
console.log(JSON.stringify({sandboxRef:c.ref,futureWired:future.length,historicalNotBackfilled:all.length-future.length,first:future[0]?.releaseAt,last:future.at(-1)?.releaseAt,providerCalls:0}));
