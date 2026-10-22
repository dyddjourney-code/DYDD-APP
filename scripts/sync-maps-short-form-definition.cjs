// Schema-free, single-row reference-content update. Defaults to a read-only backup/plan.
// node scripts/sync-maps-short-form-definition.cjs [--apply]
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const load=require('./fruitlife-test-load.cjs');
const {mapsShortFormDefinition:short,mapsShortFormVersion:version}=load('lib/maps-report/report.ts');
(async()=>{
 const c=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-supabase.json'));
 if(c.ref!=='laojrzlqbkmirzcbcnyw'||!c.project_url.includes(c.ref))throw Error('Not the authorized production school database.');
 const out=path.resolve('tmp/maps-short-form');fs.mkdirSync(out,{recursive:true});
 const headers={apikey:c.service_role_key,Authorization:'Bearer '+c.service_role_key,'Content-Type':'application/json'};
 const endpoint=c.project_url+'/rest/v1/native_assessment_definitions';
 async function read(){const r=await fetch(endpoint+'?assessment_type=eq.maps_personal_roadmap&select=*',{headers});if(!r.ok)throw Error('Read '+r.status);const rows=await r.json();if(rows.length!==1)throw Error('Expected exactly one MAPS definition');return rows[0]}
 const before=await read(),stamp=new Date().toISOString().replace(/[:.]/g,'-'),backup=path.join(out,`native-definition-backup-${stamp}.json`);
 fs.writeFileSync(backup,JSON.stringify(before,null,2),{mode:0o600});
 const next={...before.definition,short_form:{...short,sections:undefined},authored_sections:short.sections};
 const patch={version,definition:next,updated_at:new Date().toISOString()};
 fs.writeFileSync(path.join(out,'native-definition-planned.json'),JSON.stringify(patch,null,2));
 if(!process.argv.includes('--apply')){console.log(JSON.stringify({state:'read-only plan',id:before.id,previousVersion:before.version,nextVersion:version,backup}));return}
 const qs=new URLSearchParams({id:'eq.'+before.id,version:'eq.'+before.version,updated_at:'eq.'+before.updated_at});
 const r=await fetch(endpoint+'?'+qs,{method:'PATCH',headers:{...headers,Prefer:'return=representation'},body:JSON.stringify(patch)});if(!r.ok)throw Error('Update '+r.status+': '+await r.text());const written=await r.json();if(written.length!==1)throw Error('Concurrent update: expected exactly one updated row');
 const after=await read();fs.writeFileSync(path.join(out,'native-definition-readback.json'),JSON.stringify(after,null,2));
 const canonical=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
 if(after.version!==version||canonical(after.definition)!==canonical(next))throw Error('Readback mismatch');
 const receipt={id:after.id,version:after.version,previousVersion:before.version,backup,readback:path.join(out,'native-definition-readback.json'),sha256:crypto.createHash('sha256').update(canonical(after.definition)).digest('hex'),status:'PASS: exact single-row readback'};
 fs.writeFileSync(path.join(out,'database-receipt.json'),JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));
})().catch(e=>{console.error(e.message);process.exitCode=1});
