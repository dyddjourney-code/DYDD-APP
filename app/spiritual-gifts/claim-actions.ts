'use server';
import { redirect } from 'next/navigation';
import { linkCurrentPublicGiftsToAccount } from '@/lib/public-assessments/gifts-account';
export async function claimPublicSpiritualGifts(form: FormData) {
  const session = String(form.get('session') || '');
  const token = String(form.get('token') || '');
  let message = 'Your Spiritual Gifts result is connected to your account.';
  try { await linkCurrentPublicGiftsToAccount(session, token); }
  catch (error) { message = error instanceof Error ? error.message : 'Unable to connect this result.'; }
  redirect('/spiritual-gifts/thanks?' + new URLSearchParams({session, token, message}));
}
