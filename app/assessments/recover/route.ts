import { NextRequest, NextResponse } from 'next/server';
import { verifyGuestCapability, ownedGuestResult, requireGuest } from '@/lib/public-assessments/guest';
import { guestCookie, guestSessionPath, guestCapabilityLifetime } from '@/lib/public-assessments/guest-capability';
import { markGuestCheckoutResumed } from '@/lib/public-assessments/guest-checkout-reminder';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest) {
 const id=request.nextUrl.searchParams.get('session')||'';
 let token=request.nextUrl.searchParams.get('key')||'';
 let response;
 try{
  try{await verifyGuestCapability(id,token);}
  catch{
   // Email recovery rotates the bearer. A still-open Stripe session may return
   // its old URL, but ONLY this browser’s separately verified same-session cookie
   // can recover that return. The revoked URL token grants no access.
   const current=await requireGuest(id);token=current.token;
  }
  // Recovery of paid access does not depend on the optional reminder queue.
  try{await markGuestCheckoutResumed(id);}catch{/* A later visit retries durable suppression; no email is sent by this route. */}
  const report=request.nextUrl.searchParams.get('report');
  if(report)await ownedGuestResult(id,report);
  const product=request.nextUrl.searchParams.get('product');
  const query=new URLSearchParams();if(report)query.set('result',report);if(product==='designid'||product==='designpd')query.set('product',product);
  response=NextResponse.redirect(new URL(guestSessionPath(id)+(query.size?'?'+query:''),request.url),303);
  response.cookies.set('dydd_guest_current',id,{httpOnly:true,secure:request.nextUrl.protocol==='https:',sameSite:'lax',path:'/assessments',maxAge:guestCapabilityLifetime});
  response.cookies.set(guestCookie(id),token,{httpOnly:true,secure:request.nextUrl.protocol==='https:',sameSite:'lax',path:'/assessments',maxAge:guestCapabilityLifetime});
 }catch{response=new NextResponse('This private recovery link is invalid or expired. Contact DYDD with your purchase receipt; do not repurchase.',{status:403});}
 response.headers.set('Cache-Control','private, no-store');response.headers.set('Referrer-Policy','no-referrer');response.headers.set('X-Robots-Tag','noindex, nofollow');
 return response;
}
