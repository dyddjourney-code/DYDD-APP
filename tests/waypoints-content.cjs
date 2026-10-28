/* Independent source/content invariants. No database writes; NIV references fetched read-only. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const load = require('../scripts/fruitlife-test-load.cjs');
const original = JSON.parse(execFileSync('git', ['show', `${process.env.WAYPOINT_BASELINE_REF || '208b36c7d9c5bb6182f088b0f1f5341d9c068d8d'}:lib/waypoints/waypoints.json`], {encoding:'utf8'}));
const data = JSON.parse(fs.readFileSync('lib/waypoints/waypoints.json','utf8'));
const model = load('lib/waypoints/waypoint-data.ts');
const types = ['Architect','Artisan','Shepherd','Steward'];
const baseline = original.slice(0,23);
assert.equal(baseline.length,23,'original 23 available in git baseline');
assert.equal(data.length,35,'35 total Waypoints');
assert.equal(new Set(data.map(w=>w.id)).size,35,'unique stable IDs');
for (const old of baseline) {
  const w=data.find(w=>w.id===old.id); assert(w,`preserve original ID ${old.id}`);
  for (const key of ['id','date','releaseAt','title','body','scripture','category','tags','excerpt'])
    assert.deepEqual(w[key],old[key],`${old.id}: preserve ${key}`);
}
const added=data.filter(w=>!baseline.some(old=>old.id===w.id));
assert.equal(added.length,12,'12 genuinely additional Waypoints');
const normalize=s=>s.toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9']/g,' ').replace(/\s+/g,' ').trim();
const existingTitles = new Set(baseline.map(w=>normalize(w.title)));
const existingBodies = new Set(baseline.map(w=>normalize(w.body.join(' '))));
for (const w of added) {
  assert(!existingTitles.has(normalize(w.title)),`${w.id}: new title`);
  assert(!existingBodies.has(normalize(w.body.join(' '))),`${w.id}: new devotional, not recycled body`);
  assert(w.body.length>=2 && w.body.join(' ').split(/\s+/).length>=35,`${w.id}: substantial original devotional`);
}
assert.equal(new Set(added.map(w=>normalize(w.body.join(' ')))).size,12,'new devotionals distinct from one another');
const scheduled=data.filter(w=>w.releaseAt>='2026-09-04').sort((a,b)=>a.releaseAt.localeCompare(b.releaseAt));
const eastern=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'long',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
for(let i=0;i<scheduled.length;i++) {
  const w=scheduled[i], parts=Object.fromEntries(eastern.formatToParts(new Date(w.releaseAt)).map(p=>[p.type,p.value]));
  assert.equal(parts.weekday,'Friday',`${w.id}: Friday release`);
  assert.equal(parts.hour+':'+parts.minute,'08:00',`${w.id}: 8 AM Eastern (including DST)`);
  const day=new Date(w.releaseAt).toISOString().slice(0,10), expected=new Date(Date.UTC(2026,8,4+i*7)).toISOString().slice(0,10);
  assert.equal(day,expected,`${w.id}: no missing/duplicate weekly release`);
}
assert.equal(scheduled.filter(w=>w.releaseAt<'2027-02-01').at(-1).releaseAt.slice(0,10),'2027-01-29','Jan31 cutoff ends Friday Jan29');
assert.equal(scheduled.at(-1).releaseAt.slice(0,10),'2027-02-12','buffer extends to February12');
assert.equal(added[0].releaseAt.slice(0,10),'2026-11-27');
const sentences=s=>(s.match(/[.!?](?:[”’"']?)(?:\s|$)/g)||[]).length;
const allReflections=[];
for(const w of data) {
  assert.equal(w.scriptureTranslation,'NIV',`${w.id}: NIV label`);
  assert(w.scriptureAttribution?.includes('Biblica') && /2011/.test(w.scriptureAttribution),`${w.id}: NIV attribution`);
  assert(w.scriptureText?.trim().length>30,`${w.id}: complete passage text present`);
  assert(!/\.{3}|…|\b(?:excerpt|paraphrase)\b/i.test(w.scriptureText),`${w.id}: no abbreviated/paraphrased passage`);
  assert.deepEqual(Object.keys(w.reflections).sort(),[...types].sort(),`${w.id}: exactly four variants`);
  const variants=[w.reflection,...types.map(t=>w.reflections[t])];
  assert.equal(new Set(variants.map(normalize)).size,5,`${w.id}: generic and four different reflections`);
  assert(!/\b(?:Architects?|Artisans?|Shepherds?|Stewards?)\b/.test(w.reflection),`${w.id}: generic reflection not four-type list`);
  for(const [i,text] of variants.entries()) {
    assert(sentences(text)>=2 && text.split(/\s+/).length>=25,`${w.id}: multi-sentence developed reflection ${i}`);
    if(i) for(const other of types.filter(t=>t!==types[i-1])) assert(!new RegExp(`\\b${other}s?\\b`,'i').test(text),`${w.id}: ${types[i-1]} not another type list`);
    allReflections.push(normalize(text));
  }
  const before=JSON.stringify(w);
  for(const primary of [...types,'','   ','Unknown','architect','__proto__']) {
    const result=model.personalizeWaypoint(w,primary);
    assert.equal(result.reflection,types.includes(primary)?w.reflections[primary]:w.reflection,`${w.id}: saved exact Primary ${primary}`);
    assert(!Object.hasOwn(result,'reflections'),'browser payload excludes variant map');
    const payload=JSON.stringify(result);
    for(const t of types.filter(t=>t!==primary)) assert(!payload.includes(w.reflections[t]),`${w.id}: no ${t} variant in browser payload`);
    assert.equal(result.scriptureText,w.scriptureText,'full scripture survives personalization');
  }
  assert.equal(model.personalizeWaypoint(w,' Architect ').reflection,w.reflections.Architect,'saved Primary whitespace normalized');
  assert.equal(JSON.stringify(w),before,'personalization is pure and leaves archive unchanged');
}
const distinctDevotionals=new Set(data.map(w=>normalize(w.body.join(' ')))).size;
assert(new Set(allReflections).size>=distinctDevotionals*5,'five authored applications per distinct devotional; preserved historical repeats may share their matching applications');
for(const instant of ['2026-10-23T11:59:59Z','2026-10-23T12:00:00Z','2026-11-06T12:59:59Z','2026-11-06T13:00:00Z','2027-01-31T23:59:59Z','2027-02-12T13:00:00Z']) {
  const released=model.getReleasedWaypoints(new Date(instant));
  assert(released.every(w=>Date.parse(w.releaseAt)<=Date.parse(instant)),'no future content released early');
  assert.deepEqual(released.map(w=>w.id),data.filter(w=>Date.parse(w.releaseAt)<=Date.parse(instant)).sort((a,b)=>Date.parse(b.releaseAt)-Date.parse(a.releaseAt)).map(w=>w.id));
}
// Saved Primary must beat contradictory numeric scores. This uses the real report reader,
// but a deliberately unusable admin mock ensures no accidental database access.
const context=load('lib/assessments/student-context.ts',{'@/lib/supabase/admin':{createSupabaseAdminClient(){throw Error('Unexpected DB call in pure content test');}}});
for(const primary of [...types,'','Unrecognized']) for(const section of ['summary','reportPayload','profileLanguage','scores','root']) {
  const cells={Primary:primary,Architect_Pts:primary==='Architect'?1:100,Artisan_Pts:primary==='Artisan'?1:100,Shepherd_Pts:primary==='Shepherd'?1:100,Steward_Pts:primary==='Steward'?1:100};
  const snapshot={assessment_type:'designid',id:'pure-qa',created_at:'2026-10-23T00:00:00Z',source:'waypoints_pure_qa',source_submitted_at:'2026-10-23T00:00:00Z',scores:section==='root'?cells:{[section]:cells}};
  const saved=context.buildDesignIdContext({all:[snapshot],latest:[snapshot]}).primary;
  assert.equal(saved,primary,`${section}: use explicitly saved Primary, never infer from score`);
  assert.equal(model.personalizeWaypoint(data[0],saved).reflection,types.includes(primary)?data[0].reflections[primary]:data[0].reflection);
}
// Independently fetch the exact cited NIV verse/range. Token equality rejects both
// truncated verses and a larger passage incorrectly shown under a smaller reference.
function decode(s){return s.replace(/&#(x[0-9a-f]+|\d+);/gi,(_,n)=>String.fromCodePoint(n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):+n)).replace(/&(nbsp|amp|quot|apos|lt|gt|rsquo|lsquo|rdquo|ldquo|mdash|ndash);/g,(_,n)=>({nbsp:' ',amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',rsquo:'’',lsquo:'‘',rdquo:'”',ldquo:'“',mdash:'—',ndash:'–'}[n]));}
if(process.env.WAYPOINT_SKIP_NIV_NETWORK!=='1') {
  const refs=new Map();
  for(const w of data) {
    if(!refs.has(w.scripture)) {
      const html=execFileSync('curl',['--fail','--silent','--show-error','--location','--max-time','30',`https://www.biblegateway.com/passage/?search=${encodeURIComponent(w.scripture)}&version=NIV`],{encoding:'utf8',maxBuffer:3e6});
      const match=html.match(/<div class=['"]std-text['"]>([\s\S]*?)<div class=['"]il-text['"]>/);
      assert(match,`NIV reference source readable: ${w.scripture}`);
      const text=decode(match[1].replace(/<sup\b[\s\S]*?<\/sup>/gi,'').replace(/<h[1-6]\b[\s\S]*?<\/h[1-6]>/gi,'').replace(/<\/?(?:p|div|br)\b[^>]*>/gi,' ').replace(/<[^>]*>/g,''));
      refs.set(w.scripture,normalize(text));
    }
    assert.equal(normalize(w.scriptureText),refs.get(w.scripture),`${w.id}: exact complete cited NIV passage (no omitted/extra verses)`);
  }
  console.log(`PASS independent NIV source equality for all35 (${refs.size} distinct references)`);
} else console.log('SKIPPED independent online NIV equality (WAYPOINT_SKIP_NIV_NETWORK=1)');
console.log('PASS original23 immutable; total35/new12; weekly Friday08:00 Eastern/DST/Jan29/Feb12;35 complete five-reflection sets, distinctive per devotional; pure saved-Primary personalization; variant payload isolation; release boundaries');
