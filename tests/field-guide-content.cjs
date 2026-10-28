const fs=require('node:fs'), assert=require('node:assert/strict');
const c=JSON.parse(fs.readFileSync('lib/circles/field-guide-content.json','utf8'));
const src=fs.readFileSync('../dydd-source-library/extracted_text/DYDD__Books__Leaders__Playbook.docx.txt','utf8').split(/\r?\n/);
const lines=(a,z)=>src.slice(a-1,z-1).map(x=>x.trim()).filter(Boolean);
const specs=[['expertise',273,294,899,909,982],['story',295,320,910,919,972],['desire',321,345,920,930,987],['spiritual-gifts',346,394,931,941,992],['niche-preparation',395,420,942,952,997],['declarations-commissioning',421,445,953,963,1002]];
// These source paragraphs describe the older operational/report delivery model.
// Their teaching is retained; current access/report/timing equivalents replace them.
const giftsAdapted=[349,370,372,376,377,378,392,393];
assert.equal(Object.keys(c.sessions).length,6);
for(const [key,a,z,ta,tz,qa] of specs){
 const g=c.sessions[key];
 assert(g.prepare.length>=5&&g.readings.length>=6&&g.help.length>=6&&g.followThrough.length>=3,key+' complete practical guide');
 assert.equal(g.flow.reduce((n,x)=>n+x.minutes,0),90,key+' adaptable example');
 assert.deepEqual(g.questions.map(q=>q.question),lines(qa,qa+4),key+' original question bank');
 assert.deepEqual(g.readings[1].paragraphs,lines(ta,tz),key+' full teaching outline');
 if(key!=='spiritual-gifts')assert.deepEqual(g.readings[0].paragraphs,lines(a,z),key+' full primary teaching');
 else{
  const original=lines(a,z),actual=g.readings[0].paragraphs;
  assert.equal(actual.length,original.length,'Gifts adaptations retain paragraph coverage');
  const changes=[];original.forEach((p,i)=>{if(p!==actual[i])changes.push(a+i);});
  assert.deepEqual(changes,giftsAdapted,'Only documented operational Gifts paragraphs adapted');
 }
 assert.deepEqual(g.readings.find(r=>r.title==='Facilitation — full guidance').paragraphs,lines(446,507),key+' complete facilitation reading');
 assert(g.questions.every(q=>q.followup&&q.help),key+' practical discussion support');
 const text=JSON.stringify(g);
 assert(!/Insert QR|\b(?:chapter \d+|appendix [a-m])\b|spiritual-gifts-test/i.test(text),key+' descriptive resources and current access');
 console.log('PASS '+key+': complete source teaching, outline, original questions, facilitation and practical guide');
}
for(const key of ['niche-preparation','declarations-commissioning']){
 const g=c.sessions[key];
 assert.deepEqual(g.readings.find(r=>r.title==='Moving from discovery into purpose').paragraphs,lines(580,628));
 assert.deepEqual(g.readings.find(r=>r.title.startsWith('Purpose conversations')).paragraphs,lines(1181,1197));
}
const closing=c.sessions['declarations-commissioning'];
assert.deepEqual(closing.readings.find(r=>r.title.startsWith('An alumni gathering')).paragraphs,lines(1104,1134));
assert.deepEqual(closing.readings.find(r=>r.title.startsWith('Launching an alumni')).paragraphs,lines(1135,1180));
assert.equal(closing.readings.find(r=>r.title==='Continuing in purpose together').paragraphs.at(-1),src[784]);
assert(closing.prepare.some(a=>a.paragraphs.some(p=>p.includes('suggested wording, not a quotation'))),'Commissioning adaptation is identified');
assert.equal(new Set(c.resources.map(r=>r.id)).size,c.resources.length,'Unique toolkit ids');
assert(c.resources.every(r=>r.blocks.length||r.readings.length),'All toolkit entries have usable content');
assert(c.resources.slice(6).every(r=>r.blocks.length&&r.readings.length),'New contextual tools include full readings');
console.log('PASS distinct Niche/commissioning, complete activation/purpose/alumni resources, adaptation labeling and usable toolkit');
