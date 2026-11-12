import { NextResponse } from 'next/server';
import { requireGuest, ownedGuestResult } from '@/lib/public-assessments/guest';
import { guestStoredReport } from '@/lib/public-assessments/guest-reports';
import { storedReportUrl } from '@/lib/assessments/report-storage';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{sessionId:string;resultId:string}>}) {
 const {sessionId,resultId}=await params;
 try{
  await requireGuest(sessionId);
  const result=await ownedGuestResult(sessionId,resultId),url=await storedReportUrl(guestStoredReport(result),true);
  if(!url)throw Error('Archive unavailable.');
  const response=NextResponse.redirect(url,303);response.headers.set('Cache-Control','private, no-store');response.headers.set('Referrer-Policy','no-referrer');response.headers.set('X-Robots-Tag','noindex, nofollow');return response;
 }catch{return new NextResponse('This report is unavailable. Open your private recovery link or retry the original report. Do not repurchase.',{status:403,headers:{'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});}
}
