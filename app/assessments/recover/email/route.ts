import {NextRequest,NextResponse} from 'next/server';
import {createSupabaseAdminClient} from '@/lib/supabase/admin';
import {publicAssessmentLedgerEnabled} from '@/lib/public-assessments/config';
import {guestCapabilityHash,guestSessionId,newGuestCapability,guestCookie,guestSessionPath,guestCapabilityLifetime} from '@/lib/public-assessments/guest-capability';
export const dynamic='force-dynamic';
function protect(response:NextResponse) {
 response.headers.set('Cache-Control','private, no-store');
 response.headers.set('Referrer-Policy','no-referrer');
 response.headers.set('X-Robots-Tag','noindex, nofollow');
 response.headers.set('Content-Security-Policy',"default-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
 return response;
}
function invalid() {return protect(new NextResponse('This recovery link is invalid, already used or expired. Request a new private link from the assessment page. Your saved purchase is preserved; do not repurchase.',{status:403}));}
/** GET never consumes a one-time token: email preview/scanning cannot rotate access. */
export async function GET(request:NextRequest) {
 try {
  const id=guestSessionId(request.nextUrl.searchParams.get('request')||''),token=request.nextUrl.searchParams.get('key')||'';
  guestCapabilityHash(token);
  return protect(new NextResponse('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Restore private assessment access</title><body><main><h1>Restore your private assessment access</h1><p>Your saved purchase and original answers are preserved. Confirm to continue in this browser. This replaces older private links for the same guest session.</p><form method="post" action="/assessments/recover/email"><input type="hidden" name="request" value="'+id+'"><input type="hidden" name="key" value="'+token+'"><button type="submit">Restore my saved assessment</button></form></main></body></html>',{headers:{'Content-Type':'text/html; charset=utf-8'}}));
 }catch{return invalid();}
}
export async function POST(request:NextRequest) {
 try {
  if(!publicAssessmentLedgerEnabled()||request.headers.get('origin')!==request.nextUrl.origin)return invalid();
  const form=await request.formData(),id=guestSessionId(String(form.get('request')||'')),key=String(form.get('key')||''),token=newGuestCapability();
  const redeemed=await createSupabaseAdminClient().rpc('dydd_guest_redeem_recovery',{p_id:id,p_token_hash:guestCapabilityHash(key),p_capability_hash:guestCapabilityHash(token)});
  if(redeemed.error||!redeemed.data?.session_id)return invalid();
  const sid=guestSessionId(redeemed.data.session_id),product=redeemed.data.product==='designpd'?'designpd':'designid';
  const response=protect(NextResponse.redirect(new URL(guestSessionPath(sid)+'?product='+product,request.url),303));
  const options={httpOnly:true,secure:request.nextUrl.protocol==='https:',sameSite:'lax' as const,path:'/assessments',maxAge:guestCapabilityLifetime};
  response.cookies.set(guestCookie(sid),token,options);
  response.cookies.set('dydd_guest_current',sid,options);
  return response;
 }catch{return invalid();}
}
