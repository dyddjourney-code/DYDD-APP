// Read-only fixtures and local scoring: no database, report generation, or email.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const ts = require('typescript');
const out = fs.mkdtempSync(path.join(os.tmpdir(),'designid-parity-'));
try {
  const files=['lib/designid/intake.ts','lib/designid/engine.ts','lib/designid/maps-confirmation.ts','lib/designid/report.ts','lib/designpd/intake.ts','lib/designpd/engine.ts','lib/designpd/report.ts'];
  for (const f of files) {
    const target=path.join(out,f.replace(/\.ts$/,'.js'));fs.mkdirSync(path.dirname(target),{recursive:true});
    fs.writeFileSync(target,ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText);
  }
  fs.mkdirSync(path.join(out,'lib/designpd/source'),{recursive:true});
  fs.copyFileSync('lib/designpd/source/libraries.json',path.join(out,'lib/designpd/source/libraries.json'));
  const {designIdQuestionBlocks:blocks,designIdQuestionBank:bank}=require(path.join(out,'lib/designid/intake.js'));
  const {scoreDesignId,parseDesignIdAllocationAnswers:parse,designIdScorePayload:payload}=require(path.join(out,'lib/designid/engine.js'));
  const {scoreDesignPd}=require(path.join(out,'lib/designpd/engine.js'));
  const {buildDesignPdReportPayload}=require(path.join(out,'lib/designpd/report.js'));
  const {buildDesignIdReportPayload,designIdSnapshotSections}=require('../scripts/fruitlife-test-load.cjs')('lib/designid/report.ts');
  const {scoreMapsConfirmation,mapsConfirmationItems:items}=require(path.join(out,'lib/designid/maps-confirmation.js'));
  const audited=JSON.parse(fs.readFileSync('tests/fixtures/designid-audited-statements.json'));
  const approvedEdits = {'B10_S1':'I bring calm when there is tension.', 'B12_S1':'I stay faithful with what’s entrusted to me.'};
  assert.deepEqual(bank.map(({code,reflection,text})=>({code,reflection,text})),audited.map(item=>({...item,text:approvedEdits[item.code]??item.text})),'Preserve the audit bank except the two October 15 owner-approved wording edits');
  assert.equal(new Set(bank.map(item=>item.text.toLowerCase())).size,80,'No repeated statements');
  const key=JSON.parse(fs.readFileSync('tests/fixtures/designid-workbook-formulas.json'))['Key!A1:H85'].slice(1);
  assert.deepEqual(bank.map(({code,reflection})=>[code,reflection]),key.map(r=>[r[1],r[3]]));
  const make=(pattern)=>{const f=new FormData();for(const b of blocks)for(const [i,s] of b.statements.entries())f.set(`designid_points_${s.code}`,String(pattern[i]));return f;};
  let cases=0;
  for(let a=0;a<=3;a++)for(let b=0;b<=3;b++)for(let c=0;c<=3;c++)for(let d=0;d<=3;d++){
    const f=make([a,b,c,d]);if(a+b+c+d!==5){assert.throws(()=>parse(f));continue;}
    const main=scoreDesignId(parse(f));assert.equal(main.totalPoints,100);const p=payload(main);
    const points=Object.fromEntries(['Architect','Artisan','Shepherd','Steward'].map(k=>[k,0]));
    for(const [i,s]of bank.entries())points[key[i][3]]+=Number(f.get(`designid_points_${s.code}`));
    assert.deepEqual(main.scores,points);
    for(const [k,v]of Object.entries(points)){
      assert.equal(p[`${k}_Pct`],v/100);
      assert.equal(p[`Band_${k}`],v>=40?'Abundant':v>=25?'Steady':v>=10?'Limited':'Drained');
    }
    const A=points.Architect,R=points.Artisan,H=points.Shepherd,S=points.Steward;
    assert.equal(p.Dreamer,(H+R)/200);assert.equal(p.Doer,(A+S)/200);
    assert.equal(p.Feel_It,(A+H)/200);assert.equal(p.Think_It,(R+S)/200);
    assert.equal(p.Solo,(A+R)/200);assert.equal(p.Together,(H+S)/200);
    assert.equal(p.Move_DreamerMinusDoer,(H+R-A-S)/200);
    assert.equal(p.Move_Feel_ItMinusThink_It,(A+H-R-S)/200);
    assert.equal(p.Move_SoloMinusTogether,(A+R-H-S)/200);
    const snap={id:'local',assessment_type:'designid',scores:{scores:p,...designIdSnapshotSections(main)},source:'local',source_submitted_at:null,created_at:'2026-10-15T15:00:00Z'};
    const pd=scoreDesignPd(snap);
    const expected={plan:(H+R-A-S)/200,decide:(A+H-R-S)/200,do:(A+R-H-S)/200};assert.deepEqual(pd.movement,expected);
    const labels={plan:['Doer','Dreamer'],decide:['Think_It','Feel_It'],do:['Together','Solo']};
    for(const axis of ['plan','decide','do']){const v=expected[axis],abs=Math.abs(v);assert.equal(pd.axisScores[axis],Math.round(abs*100));assert.equal(pd.axisTendencies[axis],abs<=.05?'Balanced':`${abs>=.16?'Strong':'Moderate'}_${labels[axis][v>0?1:0]}`);}
    const pdReport=buildDesignPdReportPayload({designIdSnapshot:snap,participantName:'Local QA',participantEmail:'qa@example.invalid',result:pd});
    assert.equal(pdReport.move_dreamer_minus_doer,`${(expected.plan*100).toFixed(1)}%`);assert.equal(pdReport.plan_score,Math.round(Math.abs(expected.plan)*100));
    const before=JSON.stringify(main),pdBefore=JSON.stringify(pd);
    for(const reverse of [false,true]){
      const assignments=Object.fromEntries(items.map((item,i)=>[item.id,['most','often','sometimes','least'][Math.floor((reverse?11-i:i)/3)]]));
      main.mapsConfirmation=scoreMapsConfirmation(assignments,main);assert.equal(JSON.stringify(scoreDesignPd({...snap,scores:{...snap.scores,mapsConfirmation:main.mapsConfirmation}})),pdBefore);
      const report=buildDesignIdReportPayload({participantName:'Local QA',participantEmail:'qa@example.invalid',result:main});
      assert.equal(report.Total_Pts,100);assert.equal(report.Architect_Pct,`${points.Architect}`);
      delete main.mapsConfirmation;assert.equal(JSON.stringify(main),before);
    }
    cases++;
  }
  assert.throws(()=>parse(new FormData()));
  for(const bad of ['', '4','-1','1.5','NaN']){const f=make([3,2,0,0]);f.set('designid_points_B01_S1',bad);assert.throws(()=>parse(f));}
  const duplicate=make([3,2,0,0]);duplicate.append('designid_points_B01_S1','3');assert.throws(()=>parse(duplicate));
  assert.throws(()=>scoreDesignId({}));
  assert.throws(()=>scoreDesignPd({scores:{scores:{Architect_Pts:30,Artisan_Pts:30,Shepherd_Pts:30,Steward_Pts:30,Total_Pts:120}}}));
  // All possible 100-point score vectors, including exact helper cutoffs .05 and .16.
  let vectors=0;
  for(let A=0;A<=60;A++)for(let R=0;R<=60;R++)for(let H=0;H<=60;H++){
    const S=100-A-R-H;if(S<0||S>60)continue;
    const snap={scores:{scores:{Architect_Pts:A,Artisan_Pts:R,Shepherd_Pts:H,Steward_Pts:S,Total_Pts:100}}};const pd=scoreDesignPd(snap);
    const movements={plan:(H+R-A-S)/200,decide:(A+H-R-S)/200,do:(A+R-H-S)/200};
    const labels={plan:['Doer','Dreamer'],decide:['Think_It','Feel_It'],do:['Together','Solo']};
    for(const [axis,v]of Object.entries(movements)){const abs=Math.abs(v);assert.equal(pd.axisTendencies[axis],abs<=.05?'Balanced':`${abs>=.16?'Strong':'Moderate'}_${labels[axis][v>0?1:0]}`);assert.equal(pd.axisScores[axis],Math.round(abs*100));}vectors++;
  }
  let historicalCount = 0;
  if (process.env.DESIGNID_HISTORICAL_FIXTURE) {
    const fixtures = JSON.parse(fs.readFileSync(process.env.DESIGNID_HISTORICAL_FIXTURE));
    const headers = JSON.parse(fs.readFileSync('tests/fixtures/designid-workbook-formulas.json'))['Scored!D1:AC2'][0];
    for (const {allocations, expected, pdExpected} of fixtures) {
      const answers=Object.fromEntries(bank.map((statement,i)=>[statement.code,allocations[i]]));
      const actual=payload(scoreDesignId(answers));
      const legacy=Object.fromEntries(headers.map((key,i)=>[key,expected[i]]));
      for(const [key,value]of Object.entries(actual)) {
        if(typeof value==='number')assert(Math.abs(Number(legacy[key])-value)<1e-9,`Workbook mismatch: ${key}`);
        else assert.equal(value,legacy[key],`Workbook mismatch: ${key}`);
      }
      const main=scoreDesignId(answers);assert.equal(main.primary,legacy.Primary);assert.equal(main.secondary,legacy.Secondary);assert.equal(main.pairKey,legacy.PairKey);
      if(pdExpected){const pd=scoreDesignPd({scores:{scores:actual,summary:{Primary:main.primary,Secondary:main.secondary}}});
        assert.equal(pd.axisTendencies.plan,pdExpected[0]);assert.equal(pd.axisTendencies.decide,pdExpected[1]);assert.equal(pd.axisTendencies.do,pdExpected[2]);
        for(const [axis,i]of [['plan',11],['decide',12],['do',13]])assert(Math.abs(pd.movement[axis]-Number(pdExpected[i]))<1e-9);
      }
      historicalCount++;
    }
  }
  console.log(`PASS: ${historicalCount} historical workbook rows matched (private fixture stays outside repository).`);
  console.log(`PASS: 80 audited statements/key mappings; ${cases} legal allocation patterns, invalid/duplicate rejection; original capacity/fraction/movement formulas; ${vectors} DesignPD score vectors; report units; sort-invariant DesignID and DesignPD.`);
}finally{fs.rmSync(out,{recursive:true,force:true});}
