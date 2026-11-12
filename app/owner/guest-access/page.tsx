import type { Metadata } from 'next';
import Link from 'next/link';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { GuestAccessGrant } from '@/lib/public-assessments/guest-group-access';
import { requireGuestAccessOwner, revokeGuestAccessGrant } from './actions';
import { CreateGuestGrantForm } from './create-form';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Guest access links | DYDD owner',robots:{index:false,follow:false},referrer:'no-referrer'};
export default async function OwnerGuestAccess() {
 await requireGuestAccessOwner();
 const found=await createSupabaseAdminClient().from('dydd_guest_access_grants').select('id,name,kind,coupon_code,products,expires_at,max_uses,uses,revoked_at,created_at').order('created_at',{ascending:false}).limit(200);
 if(found.error)throw Error('Guest access storage could not be read.');
 return <main style={{maxWidth:920,margin:'40px auto',padding:24}}><Link href="/command-center">Command Center</Link><h1>Guest access links</h1><p>Create a named free group or coupon link without requiring app signup. You supply the name, products, expiry and enrollment limit. No course access is granted.</p><p>Expiry and the enrollment limit prevent new enrollments. Enrolled guests retain their original private sessions. Revocation immediately disables access granted by that link, including report recovery; historical scores remain saved. Sharing a link uses its enrollment limit, so give it only to intended guests.</p><CreateGuestGrantForm/><h2>Created access links</h2>{!(found.data||[]).length?<p>No links have been created.</p>:(found.data as GuestAccessGrant[]).map(grant=><section key={grant.id} style={{borderTop:'1px solid #ccc',padding:'20px 0'}}><h3>{grant.name}</h3><p>{grant.kind==='coupon'?'Coupon: '+grant.coupon_code:'Free group'} · {grant.products.join(' + ')} · {grant.uses} of {grant.max_uses} enrolled</p><p>New enrollments expire {new Date(grant.expires_at).toLocaleString('en-US',{timeZone:'UTC'})} UTC. {grant.revoked_at?'Revoked.':new Date(grant.expires_at).getTime()<=Date.now()?'Expired for new guests.':'Active.'}</p>{!grant.revoked_at?<form action={revokeGuestAccessGrant}><input type="hidden" name="grant_id" value={grant.id}/><button>Revoke this access link and its granted rights</button></form>:null}</section>)}</main>;
}
