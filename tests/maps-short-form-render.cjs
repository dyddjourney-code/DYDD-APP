// Chromium PDF integration for contrasting in-memory profiles; never touches Supabase or email.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');const load=require('../scripts/fruitlife-test-load.cjs');
const {buildMapsRoadmapHtml:build}=load('lib/maps-report/report.ts');
const chromium=require('@sparticuz/chromium').default,puppeteer=require('puppeteer-core');
(async()=>{const out=path.resolve('tmp/maps-short-form-regression');fs.mkdirSync(out,{recursive:true});
 const browser=await puppeteer.launch({args:chromium.args,executablePath:await chromium.executablePath(),headless:true});
 try{const p=await browser.newPage();await p.setViewport({width:850,height:1100});await p.emulateMediaType('print');
 const profiles=[['all-bands',[45,30,20,5],['Strong Dreamer','Moderate Feel It','Moderate Solo'],[18,12,14]],['opposing',[5,20,30,45],['Strong Doer','Strong Think It','Strong Together'],[18,25,30]],['balanced',[25,25,25,25],['Balanced','Balanced','Balanced'],[0,0,5]],['all-drained',[3,3,3,3],['Moderate Dreamer','Moderate Feel It','Moderate Solo'],[8,10,14]],['all-abundant',[45,45,45,45],['Strong Dreamer','Strong Feel It','Strong Solo'],[25,30,40]]];
 for(const [name,values,tendencies,scores] of profiles){
  const input={participant:{id:'synthetic',display_name:'Contrast Profile QA',normalized_email:null},designIdSnapshot:{scores:{scores:Object.fromEntries(['Architect','Artisan','Shepherd','Steward'].map((r,i)=>[r+'_Pts',values[i]]))}},designPdSnapshot:{scores:{axisTendencies:Object.fromEntries(['plan','decide','do'].map((a,i)=>[a,{tendency:tendencies[i],score:scores[i]}]))}}};
  await p.setContent(build(input),{waitUntil:'load',timeout:45000});
  const metrics=await p.$$eval('.maps-subcategory-page',els=>els.map(e=>({name:e.querySelector('h2').textContent,overflow:e.scrollWidth>e.clientWidth,font:getComputedStyle(e.querySelector('.maps-term-card dd')).fontSize})));assert.equal(metrics.length,12);assert(metrics.every(m=>!m.overflow&&m.font==='12px'));
  const filename=path.join(out,name+'.pdf');const pdf=await p.pdf({path:filename,format:'letter',margin:{bottom:'0.25in',left:'0.25in',right:'0.25in',top:'0.25in'},preferCSSPageSize:true,printBackground:true});assert.equal(Buffer.from(pdf).subarray(0,5).toString(),'%PDF-');
  const info=execFileSync('pdfinfo',[filename],{encoding:'utf8'});assert(/Pages:\s+18\b/.test(info),name+': unexpected pagination');
  const text=execFileSync('pdftotext',['-layout',filename,'-'],{encoding:'utf8'});assert(!text.includes('Reflection Space'));for(const t of tendencies)assert(text.includes(t));assert.equal(text.split('\f').filter(x=>x.trim()).length,18);
  console.log(`PASS PDF ${name}: 18 pages, 12 focus pages, no horizontal overflow, 12px ABC, tendency labels preserved.`);
 }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
