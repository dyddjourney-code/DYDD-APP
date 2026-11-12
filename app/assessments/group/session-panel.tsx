import { includedGuestDesignPd } from '@/lib/public-assessments/guest-group-access';
import { guestRecords } from '@/lib/public-assessments/guest';
import { unlockGuestAccessDesignPd } from './actions';
import { AssessmentSubmitButton } from '../submit-button';
export async function GuestGroupSessionPanel({sessionId}:{sessionId:string}) {
 const grant=await includedGuestDesignPd(sessionId);if(!grant)return null;
 const records=await guestRecords(sessionId),source=records.results.find(r=>r.product==='designid');
 if(records.orders.some(o=>o.product==='designpd'&&o.source_result_id===source?.id&&['pending','paid'].includes(o.status)))return null;
 return <section><h2>Included DesignPD access</h2><p>{grant.name} includes DesignPD at no charge. {source?'Open DesignPD from your saved DesignID below.':'Complete DesignID first, then return here to open DesignPD.'}</p>{source?<form action={unlockGuestAccessDesignPd.bind(null,sessionId)}><AssessmentSubmitButton pendingLabel="Opening included DesignPD…">Open included DesignPD</AssessmentSubmitButton></form>:null}</section>;
}
