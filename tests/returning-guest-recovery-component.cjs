const assert=require('node:assert/strict');
const {renderToStaticMarkup}=require('react-dom/server');
const load=require('../scripts/fruitlife-test-load.cjs');
let jar=[],verified=[],deny=false;
const sid='11111111-1111-4111-8111-111111111111';
const {ReturningGuestRecovery}=load('app/assessments/returning-guest-recovery.tsx',{
 './public-assessments.module.css':{__esModule:true,default:{primary:'primary'}},
 'next/headers':{cookies:async()=>({get:name=>jar.find(c=>c.name===name),getAll:()=>jar})},
 'next/link':({href,children})=>require('react').createElement('a',{href},children),
 '@/lib/public-assessments/guest':{requireGuest:async id=>{verified.push(id);if(deny)throw Error('private details never shown');return {session:{id}};}},
 './guest-recovery-form':{GuestRecoveryForm:()=>require('react').createElement('form',null,'Recovery form')},
});
(async()=>{
 let html=renderToStaticMarkup(await ReturningGuestRecovery({product:'designpd'}));
 assert(!html.includes('/assessments/session/'));assert.match(html,/Recovery form/);assert.equal(verified.length,0);
 jar=[{name:'dydd_guest_current',value:sid}];
 html=renderToStaticMarkup(await ReturningGuestRecovery({product:'designpd'}));assert.match(html,new RegExp('/assessments/session/'+sid+'\\?product=designpd'));assert.deepEqual(verified,[sid]);
 verified=[];jar=[{name:'dydd_guest_'+sid,value:'private-capability'}];
 html=renderToStaticMarkup(await ReturningGuestRecovery({product:'designid'}));assert.match(html,/Continue with my saved guest assessment/);assert.deepEqual(verified,[sid],'An original issued link without a current pointer still resumes');
 deny=true;html=renderToStaticMarkup(await ReturningGuestRecovery({product:'designpd'}));assert(!html.includes(sid));assert(!html.includes('private details'));assert(!html.includes('private-capability'));
 console.log('PASS returning guest component: no email identity discovery, validates existing current/session capabilities, preserves target product, invalid capability emits no private identifiers.');
})().catch(e=>{console.error(e);process.exitCode=1;});
