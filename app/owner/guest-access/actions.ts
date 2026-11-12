'use server';
import { isPrivateOwnerConsole } from '@/lib/private-owner';
import { getDyddAdminEmails } from '@/lib/admin-access';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isDyddAdminEmail } from '@/lib/admin-access';
import { newGuestCapability, guestCapabilityHash, guestSessionId } from '@/lib/public-assessments/guest-capability';
import { requireGuestAccessStorage, validateGuestGrant } from '@/lib/public-assessments/guest-group-access';
export async function requireGuestAccessOwner() {
 // The platform ALL-deployment Vercel gate protects this pinned owner project.
 // Resolve the real confirmed owner for audit FK; never invent a user/group.
 if(isPrivateOwnerConsole()) {
  requireGuestAccessStorage();
  const admins=getDyddAdminEmails();
  for(let page=1;;page++) {
   const {data,error}=await createSupabaseAdminClient().auth.admin.listUsers({page,perPage:1000});
   if(error)throw Error('Owner identity could not be verified.');
   const owner=data.users.find(u=>u.email_confirmed_at&&!u.is_anonymous&&admins.has((u.email||'').trim().toLowerCase()));
   if(owner)return owner;
   if(data.users.length<1000)throw Error('Confirmed DYDD owner account was not found.');
  }
 }

 const {data:{user},error}=await (await createSupabaseServerClient()).auth.getUser();
 if(error||!user)redirect('/login?next='+encodeURIComponent('/owner/guest-access'));
 if(!user.email_confirmed_at||!isDyddAdminEmail(user.email))throw Error('Only the DYDD owner can manage guest access.');
 requireGuestAccessStorage();
 return user;
}
export type GrantCreationState={message:string;link?:string};
export async function createGuestAccessGrant(_state:GrantCreationState,form:FormData):Promise<GrantCreationState> {
 const owner=await requireGuestAccessOwner();
 try {
  const input=validateGuestGrant({name:String(form.get('name')||''),kind:String(form.get('kind')||''),couponCode:String(form.get('coupon_code')||''),products:form.getAll('products').map(String),expiresAt:String(form.get('expires_at')||''),maxUses:String(form.get('max_uses')||'')});
  const token=newGuestCapability();
  const saved=await createSupabaseAdminClient().from('dydd_guest_access_grants').insert({...input,token_hash:guestCapabilityHash(token),created_by:owner.id}).select('id').single();
  if(saved.error||!saved.data)throw Error('The access link could not be created.');
  revalidatePath('/owner/guest-access');
  // Show once in the owner's response, never store a reusable raw capability in DB,
  // report payloads, history lists, or a success redirect/query string.
  return {message:'Link created. Copy it now; it cannot be retrieved later. Revoke it and create another if lost.',link:new URL('/assessments/group?'+new URLSearchParams({key:token}), 'https://dydd-online-school.vercel.app').href};
 } catch(error){return {message:error instanceof Error?error.message:'Access link could not be created.'};}
}
export async function revokeGuestAccessGrant(form:FormData) {
 await requireGuestAccessOwner();
 const id=guestSessionId(String(form.get('grant_id')||''));
 const result=await createSupabaseAdminClient().from('dydd_guest_access_grants').update({revoked_at:new Date().toISOString()}).eq('id',id).is('revoked_at',null);
 if(result.error)throw Error('Revocation could not be saved. Please retry.');
 revalidatePath('/owner/guest-access');
}
