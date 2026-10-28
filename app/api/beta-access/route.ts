import { NextResponse } from 'next/server';
import { betaCodeHash, hasLifetimePersonalAccess } from '@/lib/commerce/personal-access';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const reply = (body: unknown, status = 200) => NextResponse.json(body, {status, headers:{'Cache-Control':'private, no-store'}});
async function actor() {return (await (await createSupabaseServerClient()).auth.getUser()).data.user;}
export async function GET() {
  const user = await actor();
  if (!user) return reply({error:'Sign in to view your access.'},401);
  try {return reply({active:await hasLifetimePersonalAccess(user.id)});} catch {return reply({error:'Your access could not be loaded. Please try again.'},503);}
}
export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin || request.headers.get('sec-fetch-site') === 'cross-site') return reply({error:'Open Base Camp on this site to redeem your code.'},403);
  const user=await actor();
  if (!user) return reply({error:'Sign in to redeem your code.'},401);
  if (!user.email_confirmed_at) return reply({error:'Verify your email before redeeming your code.'},403);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return reply({error:'Enter your beta access code.'},415);
  if (Number(request.headers.get('content-length'))>1024) return reply({error:'Enter your beta access code.'},413);
  const body=await request.text();
  if (body.length>1024) return reply({error:'Enter your beta access code.'},413);
  let input;try{input=JSON.parse(body);}catch{return reply({error:'Enter your beta access code.'},400);}
  // Malformed guesses still count toward the durable per-account rate limit.
  const hash=betaCodeHash(input?.code) ?? 'invalid';
  try {
    const {data,error}=await createSupabaseAdminClient().rpc('redeem_dydd_beta_access',{p_user_id:user.id,p_code_hash:hash});
    if(error) return reply({error:'Your code could not be redeemed. Please try again.'},503);
    if(data==='limited') return reply({error:'Too many attempts. Please try again in 15 minutes.'},429);
    if(data==='unverified') return reply({error:'Verify your email before redeeming your code.'},403);
    if(data==='invalid') return reply({error:'This code is not available. Check your code or contact the person who invited you.'},400);
    if(data!=='active' && data!=='already_active') return reply({error:'Your code could not be redeemed. Please try again.'},503);
    return reply({active:true,message:'Your free lifetime personal all-access is active. No payment or card is needed.'});
  } catch {return reply({error:'Your code could not be redeemed. Please try again.'},503);}
}
