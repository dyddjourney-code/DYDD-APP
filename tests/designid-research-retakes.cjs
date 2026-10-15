const assert=require('node:assert/strict'), fs=require('node:fs'), os=require('node:os'),path=require('node:path'),ts=require('typescript');
const out=fs.mkdtempSync(path.join(os.tmpdir(),'designid-policy-'));
(async()=>{try {
 for(const f of ['intake','engine','maps-confirmation','research','retake-policy'])fs.writeFileSync(path.join(out,f+'.js'),ts.transpileModule(fs.readFileSync('lib/designid/'+f+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);
 const {rankAlignment,designIdResearch,applyDesignIdPresentation}=require(path.join(out,'research.js'));
 const {scoreDesignId,designIdScorePayload}=require(path.join(out,'engine.js'));
 const {scoreMapsConfirmation,mapsConfirmationItems}=require(path.join(out,'maps-confirmation.js'));
 const {designIdQuestionBlocks}=require(path.join(out,'intake.js'));
 const {addSixCalendarMonths}=require(path.join(out,'retake-policy.js'));
 const values={Architect:34,Shepherd:32,Artisan:28,Steward:6};
 assert.equal(rankAlignment(values,{Architect:3,Artisan:2,Shepherd:1,Steward:0}).coefficient,0.8);
 assert.equal(rankAlignment(values,values).coefficient,1);
 assert.equal(rankAlignment(values,{Architect:0,Shepherd:1,Artisan:2,Steward:3}).coefficient,-1);
 assert.equal(rankAlignment(values,{Architect:1,Artisan:1,Shepherd:1,Steward:1}).coefficient,null);
 assert.equal(rankAlignment({Architect:30,Artisan:20,Shepherd:30,Steward:20},values).mainRanks.Architect,1.5);
 const answers=Object.fromEntries(designIdQuestionBlocks.flatMap(b=>b.statements.map((s,i)=>[s.code,[3,2,0,0][i]])));
 const main=scoreDesignId(answers), assignments=Object.fromEntries(mapsConfirmationItems.map((item,i)=>[item.id,['most','often','sometimes','least'][Math.floor(i/3)]]));
 const sort=scoreMapsConfirmation(assignments,main);
 for(const scores of [{Architect:30,Shepherd:30,Artisan:25,Steward:15},{Architect:40,Shepherd:25,Artisan:25,Steward:10},{Architect:34,Shepherd:32,Artisan:28,Steward:6}]){
   const base={...main,scores,rankOrder:Object.keys(scores).sort((a,b)=>scores[b]-scores[a]),primary:'Architect',secondary:'Shepherd'};
   const before=JSON.stringify(base),research=designIdResearch(base,sort),presented=applyDesignIdPresentation(base,research);
   assert.equal(JSON.stringify(base),before);
   assert.deepEqual(designIdScorePayload(presented),designIdScorePayload(base));
   for(let i=1;i<presented.rankOrder.length;i++)assert(scores[presented.rankOrder[i-1]]>=scores[presented.rankOrder[i]]);
   assert.deepEqual(research,designIdResearch(base,sort));
 }
 const base={...main,scores:{Architect:40,Artisan:25,Shepherd:25,Steward:10},rankOrder:['Architect','Shepherd','Artisan','Steward'],primary:'Architect',secondary:'Shepherd'};
 const preferredSort={...sort,reflectionMeanWeights:{Architect:3,Artisan:2,Shepherd:1,Steward:0}};
 const research=designIdResearch(base,preferredSort),presented=applyDesignIdPresentation(base,research);
 assert.equal(presented.secondary,'Artisan'); assert.equal(presented.pairKey,'Architect|Artisan');
 assert.equal(rankAlignment(base.scores,preferredSort.reflectionMeanWeights).coefficient,research.coefficient);
 const flatSort={...sort,reflectionMeanWeights:{Architect:1,Artisan:1,Shepherd:1,Steward:1}};
 assert.deepEqual(applyDesignIdPresentation(base,designIdResearch(base,flatSort)).rankOrder,base.rankOrder);
 for(const [from,to] of [['2026-08-31T12:00:00Z','2027-02-28T12:00:00.000Z'],['2023-08-31T12:00:00Z','2024-02-29T12:00:00.000Z'],['2026-10-15T16:00:00Z','2027-04-15T16:00:00.000Z']])assert.equal(addSixCalendarMonths(from).toISOString(),to);
 fs.writeFileSync(path.join(out,'email.js'),ts.transpileModule(fs.readFileSync('lib/email/resend.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);
 const {assessmentEmailSender,sendResendEmail}=require(path.join(out,'email.js'));
 assert.equal(assessmentEmailSender('FruitLife360 <reports@mail.discoverdivine.design>'),'Discover Your Divine Design <reports@mail.discoverdivine.design>');
 assert.equal(assessmentEmailSender('reports@mail.discoverdivine.design'),'Discover Your Divine Design <reports@mail.discoverdivine.design>');
 let sentPayload;
 const realFetch=global.fetch;
 process.env.DYDD_RESEND_API_KEY='local-mock-not-a-real-key';
 process.env.FRUITLIFE_EMAIL_FROM='FruitLife360 <reports@mail.discoverdivine.design>';
 global.fetch=async(url,options)=>{assert.equal(url,'https://api.resend.com/emails');sentPayload=JSON.parse(options.body);return {ok:true,json:async()=>({id:'mock-send'})};};
 try {
   assert.equal((await sendResendEmail({html:'<p>Report</p>',text:'Report',subject:'Your DesignID report is ready',to:'qa@example.invalid'})).sent,true);
   assert.equal(sentPayload.from,'Discover Your Divine Design <reports@mail.discoverdivine.design>');
   assert.equal(sentPayload.subject,'Your DesignID report is ready');
   global.fetch=async()=>({ok:false,status:422,json:async()=>({message:'Mock rejection'})});
   assert.equal((await sendResendEmail({html:'x',text:'x',subject:'x',to:'qa@example.invalid'})).sent,false);
 }finally{global.fetch=realFetch;}
 console.log('PASS: original-score Spearman (ties/flat/reversed), exact-tie presentation, integrated pair selection, score payload invariance, six calendar months incl leap/end-month, sender address preserved.');
} finally {fs.rmSync(out,{recursive:true,force:true});}})().catch(error=>{console.error(error);process.exitCode=1});
