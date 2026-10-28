const assert=require('node:assert/strict'),load=require('../scripts/fruitlife-test-load.cjs');
const {journeySpiritualGiftsSnapshot}=load('lib/journey/spiritual-gifts-snapshot.ts');
const make=scores=>({id:'saved-gifts',assessment_type:'spiritual_gifts',created_at:'2026-10-02T12:00:00Z',source_submitted_at:'2026-10-01T12:00:00Z',scores});
for(const scores of [{topGifts:[{label:'Teaching',score:0},{label:'Mercy',score:9}]},{summary:{Top1_Name:'Teaching',Top1_Score:0,Top2_Name:'Mercy',Top2_Score:9}},{reportPayload:{Top1_Name:'Teaching',Top1_Score:0,Top2_Name:'Mercy',Top2_Score:9}}]){
 const s=make(scores),before=JSON.stringify(s),html=journeySpiritualGiftsSnapshot({all:[s],latest:[s]});assert(html.includes('Teaching</strong> — 0'));assert(html.includes('Mercy</strong> — 9'));assert(html.includes('Oct 1, 2026'));assert(html.includes('Saved result for this reflection round'));assert.equal(JSON.stringify(s),before);
}
const malicious=make({topGifts:[{label:'<script>bad()</script>',score:'<img src=x>'}]});const html=journeySpiritualGiftsSnapshot({all:[malicious],latest:[malicious]});assert(!html.includes('<script>'));assert(html.includes('&lt;script&gt;'));assert(!html.includes('<img src=x>'));assert(journeySpiritualGiftsSnapshot({all:[],latest:[]}).includes('No assessment retake is required'));
console.log('PASS saved native/historical/reportPayload Spiritual Gifts values, zero, explicit completion date, missing state, escaping and immutable inputs.');
