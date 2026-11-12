import { NextResponse } from 'next/server';
import { isPrivateOwnerConsole } from '@/lib/private-owner';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { guestSessionId } from '@/lib/public-assessments/guest-capability';
import { storedReportUrl, type StoredReport } from '@/lib/assessments/report-storage';
const headers={'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow'};
export const dynamic='force-dynamic';
/** Owner historical visibility is not a guest entitlement. Read only the exact
 * archived original; never call generation, scoring, checkout or email code. */
export async function GET(_request:Request,{params}:{params:Promise<{resultId:string}>}) {
 try {
  if(!isPrivateOwnerConsole())throw Error('Protected owner deployment required.');
  const id=guestSessionId((await params).resultId);
  const {data,error}=await createSupabaseAdminClient().from('dydd_guest_results').select('id,report_state,pdf').eq('id',id).maybeSingle();
  const artifact=data?.pdf?.storage as StoredReport|undefined;
  if(error||!data||data.report_state!=='ready'||!artifact||artifact.bucket!=='assessment-report-pdfs'||artifact.path!==`guest/${id}/report.pdf`)throw Error('Original report unavailable.');
  const url=await storedReportUrl(artifact,true);
  if(!url)throw Error('Original report unavailable.');
  return NextResponse.redirect(url,{status:303,headers});
 }catch{return new NextResponse('Original saved report unavailable or protected owner access required.',{status:403,headers});}
}
