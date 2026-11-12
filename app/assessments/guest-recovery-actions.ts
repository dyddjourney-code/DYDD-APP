'use server';
import {headers} from 'next/headers';
import {requestGuestRecovery,recoveryResponse} from '@/lib/public-assessments/guest-recovery';
export async function requestReturningGuestRecovery(_previous:{message:string},form:FormData):Promise<{message:string}> {
 try {
  const requestHeaders=await headers();
  // Vercel's platform-overwritten client IP header, never a user-supplied form field.
  // A shared fallback deliberately fails closed to a shared throttle outside Vercel.
  const requester=requestHeaders.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()||'shared-unverified-requester';
  await requestGuestRecovery(String(form.get('email')||''),String(form.get('product')||''),requester);
 }catch{/* No user-visible distinction between unknown, disabled, throttled, queued or failed. */}
 return {message:recoveryResponse};
}
