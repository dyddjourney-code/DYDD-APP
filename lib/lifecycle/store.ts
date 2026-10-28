import 'server-only';
import { createHash } from 'node:crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type {Category} from './templates';
export function must<T extends {error:unknown;data:unknown}>(r:T):T['data'] {if(r.error)throw Error((r.error as {message?:string}).message||'Email storage unavailable.');return r.data;}
export const tokenHash=(s:string)=>createHash('sha256').update(s).digest('hex');
export function appBase(){return (process.env.DYDD_APP_URL || (process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT==='sandbox'?'https://dydd-online-school-sandbox.vercel.app':'https://dydd-online-school.vercel.app')).replace(/\/$/,'');}
export type QueueInput={event_key:string;template_id:string;category:Category;email:string;user_id?:string|null;subject:string;body:string;scheduled_at:string;expires_at:string;context?:Record<string,unknown>;circle_id?:string;campaign_id?:string;draft_id?:string;membership_id?:string};
export async function enqueue(input:QueueInput){const db=createSupabaseAdminClient();must(await db.from('dydd_lifecycle_jobs').upsert({...input,email:input.email.trim().toLowerCase()},{onConflict:'event_key',ignoreDuplicates:true}));}
export async function enqueueCampaignMembers(campaignId:string,membershipId?:string){
 must(await createSupabaseAdminClient().rpc('dydd_queue_circle_member_messages',{campaign_key:campaignId,membership_key:membershipId||null}));
}
