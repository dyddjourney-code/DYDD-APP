import { NextRequest, NextResponse } from 'next/server';
import { verifyGuestCapability, ownedGuestResult } from '@/lib/public-assessments/guest';
import { guestCookie, guestSessionPath, guestCapabilityLifetime } from '@/lib/public-assessments/guest-capability';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest) {
 const id=request.nextUrl.searchParams.get('session')||'',token=request.nextUrl.searchParams.get('key')||'';
 let response;
 try{
  await verifyGuestCapability(id,token);
  const report=request.nextUrl.searchParams.get('report');
  if(report)await ownedGuestResult(id,report);
  const product=request.nextUrl.searchParams.get('product');
  const query=new URLSearchParams();if(report)query.set('result',report);if(product==='designid'||product==='designpd')query.set('product',product);
  response=NextResponse.redirect(new URL(guestSessionPath(id)+(query.size?'?'+query:''),request.url),303);
  response.cookies.set(guestCookie(id),token,{httpOnly:true,secure:request.nextUrl.protocol==='https:',sameSite:'lax',path:'/assessments',maxAge:guestCapabilityLifetime});
 }catch{response=new NextResponse('This private recovery link is invalid or expired. Contact DYDD with your purchase receipt; do not repurchase.',{status:403});}
 response.headers.set('Cache-Control','private, no-store');response.headers.set('Referrer-Policy','no-referrer');response.headers.set('X-Robots-Tag','noindex, nofollow');
 return response;
}
