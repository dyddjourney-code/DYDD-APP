import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isDyddAdminEmail } from '@/lib/admin-access';
import { isOwnerPreviewRequest } from '@/lib/owner-preview';
import { ownedGuestResult } from '@/lib/public-assessments/guest';
import { guestStoredReport } from '@/lib/public-assessments/guest-reports';
import { guestSessionId } from '@/lib/public-assessments/guest-capability';
import { storedReportUrl } from '@/lib/assessments/report-storage';
const headers={'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow'};
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{resultId:string}>}) {
 try {
  const url=new URL(request.url);
  const preview=isOwnerPreviewRequest({review:url.searchParams.get('review')||undefined,key:url.searchParams.get('key')||undefined});
  const {data:{user}}=await (await createSupabaseServerClient()).auth.getUser();
  if(!preview && (!user?.email_confirmed_at || user.is_anonymous || !isDyddAdminEmail(user.email)))throw Error('Owner required.');
  const id=guestSessionId((await params).resultId);
  const {data,error}=await createSupabaseAdminClient().from('dydd_guest_results').select('session_id').eq('id',id).maybeSingle();
  if(error||!data)throw Error('Report unavailable.');
  const result=await ownedGuestResult(data.session_id,id),artifact=guestStoredReport(result);
  if(artifact.path!==`guest/${id}/report.pdf`)throw Error('Report unavailable.');
  const download=await storedReportUrl(artifact,true);
  if(!download)throw Error('Report unavailable.');
  return NextResponse.redirect(download,{status:303,headers});
 }catch{return new NextResponse('Report unavailable or owner access required.',{status:403,headers});}
}
