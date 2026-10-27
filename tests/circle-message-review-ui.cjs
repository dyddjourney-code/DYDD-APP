const assert=require('node:assert/strict'),load=require('../scripts/fruitlife-test-load.cjs');
let stateIndex=0,fixture,expandedId=null;
const mockReact={...require('react'),useEffect(){},useCallback:f=>f,useState(initial){const n=stateIndex++;return [n===0?fixture:n===4?expandedId:initial,()=>{}];}};
const {CircleMessages}=load('components/circle-messages.tsx',{'react':mockReact,'@/components/circle-leader-messages':{CircleLeaderMessages:()=>null}});
const msg=(id,kind,key,extra={})=>({id,kind,message_key:key,template_id:kind==='leader'?'F02':'E01',subject:id,body:'Body',scheduled_at:'2027-01-01T12:00:00Z',expires_at:'2027-02-01T12:00:00Z',category:'circle',revision:2,approved_at:null,...extra});
fixture={campaign:{status:'draft'},messages:[msg('invite','invitation','invitation',{approved_at:'2026-10-27'}),msg('leader','leader','leader-digest-1',{excluded_at:'2026-10-27'}),msg('prep','member','preparation-2',{excluded:true})],announcements:[]};
function walk(node,items=[]){if(!node||typeof node!=='object')return items;if(Array.isArray(node)){for(const c of node)walk(c,items);return items;}items.push(node);walk(node.props?.children,items);return items;}
function render(){stateIndex=0;return walk(CircleMessages({circleId:'circle',revision:1,query:'',hasUnsavedChanges:false}));}
const text=n=>!n?'':typeof n==='string'||typeof n==='number'?String(n):Array.isArray(n)?n.map(text).join(''):text(n.props?.children);
let nodes=render();
assert.equal(nodes.filter(n=>n.type==='details'&&n.props.className==='email-message-section').length,3);
for(const title of ['Welcome series','Leader emails','Participant emails'])assert(nodes.some(n=>n.type==='summary'&&text(n).includes(title)));
assert.equal(nodes.filter(n=>n.props.className==='email-message').length,3,'every message belongs to exactly one section');
assert.equal(nodes.filter(n=>n.props.className==='email-status'&&text(n).includes('Excluded')).length,2,'both backend contracts shown as excluded');
let finalize=nodes.find(n=>n.type==='button'&&text(n).startsWith('Finalize included'));
assert.equal(finalize.props.disabled,false,'excluded messages do not block approved included message');
assert(text(nodes).includes('1 of 1 included messages approved · 2 excluded'));
assert(nodes.some(n=>typeof n.type==='function'&&n.props.url&&n.props.announcements),'custom composer remains below grouped messages');
fixture.messages[0].approved_at=null;
finalize=render().find(n=>n.type==='button'&&text(n).startsWith('Finalize included'));
assert.equal(finalize.props.disabled,true,'included unapproved message blocks finalization');
console.log('PASS three collapsible sections, complete nonduplicated grouping, timestamp/boolean exclusions, included-only finalization, preserved custom composer');

expandedId='welcome';fixture.messages=[msg('welcome','member','welcome',{body:'Welcome {{next_preparation}}\n\nOpen the Journey: https://sandbox.example/journey',approved_at:'2026-10-27'}),msg('first-prep','member','preparation-1',{body:'SECRET OMITTED PREPARATION',approved_at:null,excluded_at:'2026-10-27',expires_at:'2027-01-01T12:00:00Z'}),msg('next-prep','member','preparation-2',{body:'LATER MEETING HOMEWORK',approved_at:'2026-10-27',expires_at:'2027-01-08T12:00:00Z'})];nodes=render();const preview=text(nodes.find(n=>n.type==='pre'&&n.props.className==='email-preview'));assert(preview.includes('Your leader will confirm preparation for your next meeting.'));assert(!preview.includes('SECRET')&&!preview.includes('LATER'));assert.equal((preview.match(/Open the Journey:/g)||[]).length,1);console.log('PASS excluded next-meeting preparation uses truthful confirmation fallback, never later homework, with exactly one welcome CTA');
