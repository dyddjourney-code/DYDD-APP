'use server';
import { getOwnedAssessmentSnapshots } from '@/lib/public-assessments/identity';
import { redirect } from 'next/navigation';
import { createPublicAssessmentCheckout } from '@/lib/public-assessments/payments';
import { isDyddAdminEmail } from '@/lib/admin-access';
import { hasIncludedAssessmentAccess } from '@/lib/public-assessments/included-access';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { normalizeEmail } from '@/lib/identity/email';
import { scoreDesignPd } from '@/lib/designpd/engine';
import { hasPublicAssessmentEntitlement, redeemPublicAssessmentCode } from '@/lib/public-assessments/ledger';
import { saveDesignPdResponse } from '@/app/designpd/actions';

function productOf(form: FormData): 'designid' | 'designpd' {
 const product=String(form.get('product')||'');
 if(product!=='designid'&&product!=='designpd')redirect('/assessments');
 return product;
}
async function identity(product:string) {
 const db=await createSupabaseServerClient();const {data:{user}}=await db.auth.getUser();
 if(!user)redirect('/login?'+new URLSearchParams({next:'/assessments/'+product}));
 if(!user.email_confirmed_at)redirect('/assessments/'+product+'?message='+encodeURIComponent('Verify your account email before continuing.'));
 return user;
}
async function sourceFor(user:{id:string;email?:string},form:FormData) {
 const requested=String(form.get('sourceId')||form.get('designIdSnapshotId')||'');
 const {getOwnedArtifactSnapshot}=await import('@/lib/assessments/artifact-access');
 const source=requested?await getOwnedArtifactSnapshot(requested,user.id,normalizeEmail(user.email)):(await getOwnedAssessmentSnapshots(user)).find(s=>s.assessment_type==='designid');
 if(!source||source.assessment_type!=='designid')redirect('/assessments/designpd?message='+encodeURIComponent('Complete a valid DesignID with this account before continuing.'));
 try {scoreDesignPd(source);}catch{redirect('/assessments/designpd?message='+encodeURIComponent('Complete a valid 100-point DesignID with this account first.'));}
 return source;
}
export async function redeemAssessmentWaiver(form:FormData) {
 const product=productOf(form);const user=await identity(product);
 const source=product==='designpd'?await sourceFor(user,form):null;
 let redeemed=false;
 try{await redeemPublicAssessmentCode(user.id,product,String(form.get('code')||form.get('waiverCode')||''),source?.id);redeemed=true;}catch{/* Never expose a code, identity or raw database error in the URL. */}
 if(!redeemed)redirect('/assessments/'+product+'?message='+encodeURIComponent('That waiver could not be applied. Check its product and code, or contact support.'));
 if(product==='designpd'){
  const derived=new FormData();derived.set('designIdSnapshotId',source!.id);derived.set('emailReport','yes');
  await saveDesignPdResponse(derived);
 }
 redirect('/designid');
}
export async function beginAssessmentCheckout(form:FormData) {
 const product=productOf(form);const user=await identity(product);
 // Prerequisite enforcement happens before ANY order/provider call, including while paused.
 const source=product==='designpd'?await sourceFor(user,form):null;
 // Direct/replayed POSTs do not sell access the account already has.
 if(product==='designid'){
  const {standaloneDesignIdAccess}=await import('@/lib/public-assessments/access');
  if((await standaloneDesignIdAccess(user)).allowed)redirect('/designid');
  const {getDesignIdEligibility}=await import('@/lib/designid/retake');
  if(!(await getDesignIdEligibility(user.id,normalizeEmail(user.email),isDyddAdminEmail(user.email))).allowed)
   redirect('/assessments/designid?message='+encodeURIComponent('Your saved results remain available. Normal six-month assessment timing applies.'));
 } else {
  const {matchingReadyDesignPd}=await import('@/lib/designpd/generation');
  const {designPdContentVersion}=await import('@/lib/designpd/report');
  const saved=matchingReadyDesignPd(await getOwnedAssessmentSnapshots(user),source!.id,designPdContentVersion);
  if(saved)redirect(`/api/artifacts/${encodeURIComponent(saved.id)}/download`);
  if(isDyddAdminEmail(user.email)||await hasIncludedAssessmentAccess(user.id)||await hasPublicAssessmentEntitlement(user.id,'designpd',source!.id))redirect('/designpd?snapshot='+encodeURIComponent(source!.id));
 }
 let url:string|null=null;
 try {url=await createPublicAssessmentCheckout(user,product,source?.id);} catch {/* Do not expose raw provider/configuration errors. */}
 if(url)redirect(url);
 redirect('/assessments/'+product+'?message='+encodeURIComponent('Checkout is currently unavailable. No new access was granted. Reopen your saved report or contact support if a payment is pending.'));
}
export async function generatePurchasedDesignPd(form:FormData) {
 const user=await identity('designpd');const source=await sourceFor(user,form);
 if(!isDyddAdminEmail(user.email) && !await hasIncludedAssessmentAccess(user.id) && !await hasPublicAssessmentEntitlement(user.id,'designpd',source.id))redirect('/assessments/designpd?message='+encodeURIComponent('Unlock this DesignPD report before generating it.'));
 const derived=new FormData();derived.set('designIdSnapshotId',source.id);derived.set('emailReport','yes');
 await saveDesignPdResponse(derived);
}

export async function retrySavedAssessmentEmail(form:FormData) {
 const product=productOf(form); const user=await identity(product);
 const {getOwnedArtifactSnapshot}=await import('@/lib/assessments/artifact-access');
 const {retryOwnedAssessmentEmail}=await import('@/lib/public-assessments/delivery');
 const snapshot=await getOwnedArtifactSnapshot(String(form.get('snapshotId')||''),user.id,normalizeEmail(user.email));
 if(!snapshot || snapshot.assessment_type!==product)redirect('/assessments/'+product);
 const pdf=snapshot.scores.pdfMonkey as Record<string,unknown>|undefined;
 const storage=(snapshot.scores.reportArtifact || pdf?.storage) as Record<string,unknown>|undefined;
 if(storage?.path!==`${product}/${snapshot.id}/report.pdf`)redirect(`/api/artifacts/${encodeURIComponent(snapshot.id)}/download`);
 const origin=process.env.DYDD_APP_URL;
 if(!origin || new URL(origin).protocol!=='https:')throw Error('Canonical report origin is not configured.');
 const reportUrl=`${origin.replace(/\/$/,'')}/${product}/report?snapshot=${encodeURIComponent(snapshot.id)}`;
 const result=await retryOwnedAssessmentEmail({email:user.email!},snapshot,reportUrl);
 redirect('/assessments/'+product+'?message='+encodeURIComponent(result.sent?'Your saved report email was accepted for delivery.':result.skipped?'Your saved report is available. Email delivery needs support review.':'Your saved report email is queued for retry or reconciliation.'));
}
