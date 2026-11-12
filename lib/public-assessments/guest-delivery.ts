import 'server-only';
import { guestCapabilityHash, guestSessionId } from './guest-capability';
import { verifyGuestCapability, ownedGuestResult, GuestAccessDeniedError } from './guest';
/** Shared by immediate outbox delivery and durable retries, including a final pre-provider check. */
export async function guestReportDeliveryEligibility(job:{email:string;context?:{deliveryContext?:Record<string,unknown>}},now=Date.now()):Promise<{stop?:string;deferUntil?:string;reason?:string}> {
 if(process.env.DYDD_GUEST_EMAIL_ENABLED!=='true')return {deferUntil:new Date(now+3600000).toISOString(),reason:'Guest report email is paused.'};
 try{
  const c=job.context?.deliveryContext||{},url=new URL(String(c.reportUrl||''));
  const expected=new URL(process.env.DYDD_APP_URL||'');
  if(url.origin!==expected.origin||url.pathname!=='/assessments/recover'||url.username||url.password||url.hash||url.searchParams.getAll('key').length!==1||url.searchParams.getAll('session').length!==1||url.searchParams.get('session')!==c.guestSessionId||(url.searchParams.has('report')&&(url.searchParams.getAll('report').length!==1||url.searchParams.get('report')!==c.guestResultId)))return {stop:'Guest recovery link is invalid.'};
  try{guestSessionId(String(c.guestSessionId||''));guestSessionId(String(c.guestResultId||''));guestCapabilityHash(url.searchParams.get('key')||'');}catch{return {stop:'Guest recovery capability is invalid.'};}
  const session=await verifyGuestCapability(String(c.guestSessionId||''),url.searchParams.get('key')||'');
  if(session.participant_email!==job.email.trim().toLowerCase())return {stop:'Guest report recipient changed.'};
  const result=await ownedGuestResult(session.id,String(c.guestResultId||''));
  const storage=result.pdf.storage as {bucket?:string;path?:string}|undefined;
  if(result.report_state!=='ready'||storage?.bucket!=='assessment-report-pdfs'||storage.path!==`guest/${result.id}/report.pdf`)return {stop:'The original guest PDF is not archived.'};
  return {};
 }catch(error){
  if(error instanceof GuestAccessDeniedError)return {stop:'The original guest purchase, source, capability, or report is no longer available.'};
  return {deferUntil:new Date(now+120000).toISOString(),reason:'Guest report eligibility could not be verified. Retry the same original event after storage/configuration recovers.'};
 }
}
