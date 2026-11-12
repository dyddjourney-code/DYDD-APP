import { NextResponse } from 'next/server';
import { getAccountGuestResult, verifiedGuestAccountUser } from '@/lib/public-assessments/guest-account';
import { guestStoredReport } from '@/lib/public-assessments/guest-reports';
import { storedReportUrl } from '@/lib/assessments/report-storage';
const headers={'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow'};
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{resultId:string}>}) {
 try {
  const user=await verifiedGuestAccountUser();
  const result=await getAccountGuestResult(user.id,(await params).resultId);
  const artifact=guestStoredReport(result);
  if(artifact.path!==`guest/${result.id}/report.pdf`)throw Error('Report unavailable.');
  const url=await storedReportUrl(artifact,true);
  if(!url)throw Error('Report unavailable.');
  return NextResponse.redirect(url,{status:303,headers});
 }catch{return new NextResponse('Report unavailable. Sign in to the verified account connected to this assessment, or open your private recovery link.',{status:403,headers});}
}
