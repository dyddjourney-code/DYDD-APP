import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailWebhook } from '@/lib/email/webhook-signature';
import { sandboxRecipientAllowed } from '@/lib/email/sandbox-policy';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
export const runtime = 'nodejs';
const supported = new Set(['email.sent','email.delivered','email.bounced','email.failed','email.complained','email.delivery_delayed']);
export async function POST(request: NextRequest) {
  const secret = process.env.DYDD_RESEND_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({error:'Delivery webhook is not configured.'},{status:503});
  if (Number(request.headers.get('content-length')) > 65536) return new NextResponse(null,{status:413});
  const raw = await request.text();
  if (Buffer.byteLength(raw)>65536) return new NextResponse(null,{status:413});
  if (!verifyEmailWebhook(raw,request.headers,secret)) return NextResponse.json({error:'Invalid signature.'},{status:401});
  let event;
  try {event = JSON.parse(raw);} catch {return NextResponse.json({error:'Invalid event.'},{status:400});}
  if (!supported.has(event?.type)) return NextResponse.json({ignored:true});
  if (typeof event?.data?.email_id!=='string' || !event.created_at || !Number.isFinite(Date.parse(event.created_at))) return NextResponse.json({error:'Invalid event.'},{status:400});
  const db = createSupabaseAdminClient();
  if (process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT === 'sandbox') {
    // Provider webhooks are account-wide. Never import unrelated production/DPG
    // traffic. A signed sandbox tag handles webhook-before-acceptance races;
    // untagged historical traffic must already belong to this sandbox's ledger.
    const tagged = event.data.tags?.dydd_environment === 'sandbox' &&
      Array.isArray(event.data.to) && event.data.to.length === 1 &&
      typeof event.data.to[0] === 'string' && sandboxRecipientAllowed(event.data.to[0]);
    if (!tagged) {
      const known = await db.from('dydd_email_messages').select('id').eq('provider_id',event.data.email_id).maybeSingle();
      if (known.error) return NextResponse.json({error:'Sandbox message lookup unavailable.'},{status:503});
      if (!known.data) return NextResponse.json({ignored:true});
    }
  }
  const {data,error} = await db.rpc('dydd_record_email_event',{
    event_key:request.headers.get('svix-id'),email_id:event.data.email_id,kind:event.type,happened_at:event.created_at,
  });
  if(error) return NextResponse.json({error:'Event storage unavailable; retry this event.'},{status:503});
  return NextResponse.json({received:true,duplicate:!data});
}
