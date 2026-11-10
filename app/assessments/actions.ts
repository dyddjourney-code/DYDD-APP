'use server';
import { redirect } from 'next/navigation';
import { createPublicAssessmentCheckout } from '@/lib/public-assessments/payments';
import { isSandbox } from '@/lib/environment';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAssessmentSnapshotsForUser } from '@/lib/assessments/student-context';
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
 const records=await getAssessmentSnapshotsForUser(user.id,normalizeEmail(user.email));
 const source=records.all.find(s=>s.assessment_type==='designid'&&(!requested||s.id===requested));
 if(!source)redirect('/assessments/designpd?message='+encodeURIComponent('Complete a valid DesignID with this account before continuing.'));
 try {scoreDesignPd(source);}catch{redirect('/assessments/designpd?message='+encodeURIComponent('Complete a valid 100-point DesignID with this account first.'));}
 return source;
}
export async function redeemAssessmentWaiver(form:FormData) {
 const product=productOf(form);const user=await identity(product);
 if(!isSandbox())redirect('/assessments/'+product+'?message='+encodeURIComponent('Public assessment activation is not available in this environment.'));
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
 let url:string|null=null;
 try {url=await createPublicAssessmentCheckout(user,product,source?.id);} catch {/* Do not expose raw provider/configuration errors. */}
 if(url)redirect(url);
 redirect('/assessments/'+product+'?message='+encodeURIComponent('Stripe checkout is not connected yet. No payment was taken and no paid access was granted. You may use an authorized product waiver.'));
}
export async function generatePurchasedDesignPd(form:FormData) {
 const user=await identity('designpd');const source=await sourceFor(user,form);
 if(!await hasPublicAssessmentEntitlement(user.id,'designpd',source.id))redirect('/assessments/designpd?message='+encodeURIComponent('Unlock this DesignPD report before generating it.'));
 const derived=new FormData();derived.set('designIdSnapshotId',source.id);derived.set('emailReport','yes');
 await saveDesignPdResponse(derived);
}
