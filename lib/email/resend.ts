import { createHash, randomUUID } from 'node:crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
export type SendEmailInput = {
  attachments?: Array<{content: string; filename: string}>;
  from?: string; idempotencyKey?: string; html: string; subject: string; text: string; to: string;
  headers?: Record<string,string>;
};
export type SendEmailResult = {id?: string; message?: string; sent: boolean; skipped: boolean};
export function assessmentEmailSender(value?: string) {
  // Preserve the configured verified address. No support@ Reply-To or forwarding.
  const configured = value ?? process.env.FRUITLIFE_EMAIL_FROM ?? process.env.DYDD_EMAIL_FROM ?? 'reports@mail.discoverdivine.design';
  const address = configured.match(/<([^>]+)>/)?.[1] ?? configured.trim();
  return `Discover Your Divine Design <${address}>`;
}
export async function sendResendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT === 'sandbox') return {sent:false,skipped:true,message:'Sandbox email delivery is disabled.'};
  const apiKey = process.env.RESEND_API_KEY ?? process.env.DYDD_RESEND_API_KEY ?? '';
  if (!apiKey) return {sent:false,skipped:true,message:'DYDD email delivery is not configured.'};
  const base = (process.env.DYDD_APP_URL ?? 'https://dydd-online-school.vercel.app').replace(/\/$/,'');
  const contact = `${base}/contact`;
  const notice = `This automated mailbox is unmonitored. For help, use the DYDD Contact form: ${contact}`;
  const footer = `<p style="font-size:13px;color:#667085">This automated mailbox is unmonitored. For help, use the <a href="${contact}">DYDD Contact form</a>.</p>`;
  const html = /<\/body>/i.test(input.html) ? input.html.replace(/<\/body>/i,footer+'</body>') : input.html+footer;
  const body = {from:assessmentEmailSender(input.from),to:input.to.trim().toLowerCase(),subject:input.subject,html,text:input.text+'\n\n'+notice,...(input.attachments?.length?{attachments:input.attachments}:{}),...(input.headers?{headers:input.headers}:{})};
  const key = input.idempotencyKey ?? `dydd-${randomUUID()}`;
  const hash = createHash('sha256').update(JSON.stringify(body)).digest('hex');
  const db = createSupabaseAdminClient();
  const fail = (message:string): SendEmailResult => ({sent:false,skipped:false,message});
  const suppressed = await db.from('dydd_email_suppressions').select('email').eq('email',body.to).maybeSingle();
  if(suppressed.error) return fail('Unable to check email suppression.');
  if(suppressed.data) return {sent:false,skipped:true,message:'Recipient delivery is suppressed.'};
  const inserted = await db.from('dydd_email_messages').upsert({idempotency_key:key,recipient:body.to,payload_hash:hash},{onConflict:'idempotency_key',ignoreDuplicates:true});
  if(inserted.error) return fail('Unable to persist message intent.');
  const loaded = await db.from('dydd_email_messages').select('*').eq('idempotency_key',key).single();
  if(loaded.error) return fail('Unable to load message intent.');
  const message=loaded.data;
  if(message.payload_hash!==hash) return fail('Idempotency key payload conflict.');
  async function reconcile(providerId:string) {
    const events=await db.from('dydd_email_events').select('*').eq('provider_id',providerId).is('message_id',null).order('occurred_at');
    if(events.error) return false;
    for(const event of events.data??[]) {
      const projected=await db.rpc('dydd_record_email_event',{event_key:event.event_id,email_id:providerId,kind:event.event_type,happened_at:event.occurred_at});
      if(projected.error) return false;
    }
    return true;
  }
  if(message.provider_id) return await reconcile(message.provider_id) ? {sent:true,skipped:false,id:message.provider_id} : fail('Delivery reconciliation needs retry with the same key.');
  if(Date.now()-Date.parse(message.created_at)>23*3600000) {
    await db.from('dydd_email_messages').update({status:'review',error_message:'Reconcile provider acceptance before retry.'}).eq('id',message.id);
    return fail('Provider idempotency window exceeded; manual reconciliation required.');
  }
  try {
    const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok || !payload.id) {
      // Keep intent pending: provider 429/5xx and transport ambiguity reuse exactly the same key.
      await db.from('dydd_email_messages').update({error_message:`Provider HTTP ${response.status}`}).eq('id',message.id);
      return fail(`Provider HTTP ${response.status}; retry with the same idempotency key.`);
    }
    const saved=await db.rpc('dydd_accept_email_message',{message_key:message.id,email_id:payload.id});
    if(saved.error || !saved.data) return fail('Provider accepted; persistence failed. Retry only with the same idempotency key.');
    // Webhook can precede API response. Attach/project already-durable unmatched events.
    if(!await reconcile(payload.id)) return fail('Provider accepted; delivery reconciliation needs retry with the same key.');
    return {sent:true,skipped:false,id:payload.id};
  } catch {return fail('Provider request interrupted; retry only with the same idempotency key.');}
}
