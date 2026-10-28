'use server';
import { isSandbox } from '@/lib/environment';
import { notFound } from 'next/navigation';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { isDyddAdminEmail } from '@/lib/admin-access';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
export async function grantDesignIdRetake(form: FormData) {
  if (!isSandbox()) notFound();
  const {data:{user}} = await (await createSupabaseServerClient()).auth.getUser();
  if (!user || !isDyddAdminEmail(user.email)) redirect('/login?next=%2Fcommand-center');
  const participantId = String(form.get('participant_id') ?? '');
  const reason = String(form.get('reason') ?? '').trim();
  if (!/^[0-9a-f-]{36}$/i.test(participantId) || reason.length < 5 || reason.length > 500) redirect('/command-center?message=Please+provide+a+retake+reason.');
  const {error} = await createSupabaseAdminClient().from('designid_retake_overrides').insert({participant_id:participantId,granted_by:user.id,reason});
  if (error) redirect('/command-center?message=Unable+to+grant+retake.');
  revalidatePath('/designid'); revalidatePath('/field-kit'); revalidatePath('/command-center');
  redirect('/command-center?message=One-time+DesignID+retake+allowed+for+30+days.');
}
