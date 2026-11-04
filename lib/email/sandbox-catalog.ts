import {blankCirclePlan} from '@/lib/circles/plan';
import {circleMessageDrafts,lifecycleCopy,renderLifecycle,type LifecycleTemplate} from '@/lib/lifecycle/templates';
import {waypointArchive} from '@/lib/waypoints/waypoint-data';
export type SandboxEmailPreview={id:string;group:string;subject:string;body:string;category:string;note:string};
/** Render the actual production-copy builders with an explicitly fictional schedule. No enrollment or consent writes. */
export function sandboxEmailCatalog(base:string):SandboxEmailPreview[]{
 const rows:SandboxEmailPreview[]=Object.keys(lifecycleCopy).map(id=>({id,group:'Account and learning',...renderLifecycle(id as LifecycleTemplate,{base,course_title:'Discover Your Divine Design',course_url:base+'/journey'}),note:'Copy preview only. A test does not assert completion, consent, report readiness or course access.'}));
 const today=new Date();today.setUTCDate(today.getUTCDate()+14);
 const plan={...blankCirclePlan(),name:'Fictional Sandbox Review Circle',startDate:today.toISOString().slice(0,10),time:'19:00',timezone:'America/New_York',location:'Fictional review meeting — not a real invitation',meetingCount:8,breaks:[{start:new Date(+today+7*86400000).toISOString().slice(0,10),end:new Date(+today+13*86400000).toISOString().slice(0,10)}]};
 for(const d of circleMessageDrafts(plan,base,true))rows.push({id:d.template_id+':'+d.message_key,group:d.kind==='leader'?'Circle leader':'Circle participant',subject:d.subject,body:d.body.replaceAll('{{invitation_url}}',base+'/camp-circle/my-circles').replaceAll('{{next_preparation}}','This is a fictional preview. In a real accepted-member welcome this slot uses the next actual meeting’s separately approved preparation.'),category:d.category,note:'Fictional schedule, no Circle created. Real messages require individual creator approval, finalized current revision and eligible membership.'});
 for(const w of waypointArchive){for(const primary of ['Generic','Architect','Artisan','Shepherd','Steward'])rows.push({id:'G01:'+w.id+':'+primary,group:'Waypoints',subject:'DYDD Waypoint: '+w.title,body:[w.title,w.scripture,w.scriptureText,w.scriptureAttribution,...w.body,primary==='Generic'?w.reflection:w.reflections[primary as keyof typeof w.reflections],`Read this Waypoint: ${base}/waypoints`].filter(Boolean).join('\n\n'),category:'waypoints',note:`${w.date} · ${primary} authored application. Explicit preview; real sends use only the verified recipient’s saved Primary or Generic. Testing does not subscribe you.`});}
 return rows;
}
