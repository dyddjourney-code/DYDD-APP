import type { Metadata } from 'next';
import { AssessmentPublicShell } from '../public-assessment-ui';
import { readGuestGrant } from '@/lib/public-assessments/guest-group-access';
import { enrollGuestAccess } from './actions';
import { AssessmentSubmitButton } from '../submit-button';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Guest group access | DYDD',robots:{index:false,follow:false},referrer:'no-referrer'};
export default async function GuestGroupEntry({searchParams}:{searchParams:Promise<{key?:string;message?:string}>}) {
 const {key='',message}=await searchParams;
 let grant;try{grant=await readGuestGrant(key);}catch{return <AssessmentPublicShell><h1>Guest access link unavailable</h1><p>Use the complete access link supplied by your group organizer. If it has expired or been revoked, contact your organizer.</p></AssessmentPublicShell>;}
 return <AssessmentPublicShell><h1>{grant.name}</h1><p>Included at no charge: {grant.products.map(p=>p==='designid'?'DesignID':'DesignPD').join(' and ')}. No app signup or password is needed.</p><p>DesignPD uses only your completed DesignID in this private session. DesignID can be repeated only after six months; keep your original private recovery link.</p>{message?<p role="status">{message}</p>:null}<form action={enrollGuestAccess}><input type="hidden" name="key" value={key}/><p><label>Your name<br/><input name="name" autoComplete="name" required minLength={2} maxLength={120}/></label></p><p><label>Email for your report<br/><input name="email" type="email" autoComplete="email" required maxLength={254}/></label></p>{grant.products.includes('designid')?<p><label><input type="checkbox" name="retake" value="yes"/> Start a new DesignID retake (only after six months; otherwise resume my original session)</label></p>:null}<AssessmentSubmitButton pendingLabel="Opening your private assessment…">Open included assessment</AssessmentSubmitButton></form><p>Your private recovery link will provide access to your saved results and reports. This group link does not grant course or app access.</p></AssessmentPublicShell>;
}
