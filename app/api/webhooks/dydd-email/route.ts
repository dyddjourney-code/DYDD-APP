import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailWebhook } from '@/lib/email/webhook-signature';
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
  const {data,error} = await createSupabaseAdminClient().rpc('dydd_record_email_event',{
    event_key:request.headers.get('svix-id'),email_id:event.data.email_id,kind:event.type,happened_at:event.created_at,
  });
  if(error) return NextResponse.json({error:'Event storage unavailable; retry this event.'},{status:503});
  return NextResponse.json({received:true,duplicate:!data});
}
