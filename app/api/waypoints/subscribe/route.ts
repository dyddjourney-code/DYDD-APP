import {randomBytes,createHmac} from 'node:crypto';
import {NextResponse} from 'next/server';
import {createSupabaseAdminClient} from '@/lib/supabase/admin';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {sameOrigin} from '@/lib/circles/server';
import {appBase,must,tokenHash} from '@/lib/lifecycle/store';
import {lifecycleHtml} from '@/lib/lifecycle/templates';
export const runtime='nodejs';
export async function POST(request:Request){
 if(!sameOrigin(request)||request.headers.get('sec-fetch-site')==='cross-site')return NextResponse.json({message:'Open the signup form on this site.'},{status:403});
 const raw=await request.text();if(raw.length>4000)return NextResponse.json({message:'Check your email address.'},{status:413});
 let b:any;try{b=JSON.parse(raw);}catch{return NextResponse.json({message:'Enter a valid email address.'},{status:400});}
 const email=typeof b.email==='string'?b.email.trim().toLowerCase():'';
 if(email.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email))return NextResponse.json({message:'Enter a valid email address.'},{status:400});
 try{
 const user=(await (await createSupabaseServerClient()).auth.getUser()).data.user,token=randomBytes(32).toString('hex'),key='waypoint-confirm-'+tokenHash(token),link=appBase()+'/waypoints/confirm?token='+token;
 const subject='Confirm your DYDD Waypoints subscription',text=`You requested the weekly DYDD Waypoint.\n\nConfirm your email to receive a devotional on Friday mornings at 8:00 AM Eastern:\n${link}\n\nThis confirmation link expires in 24 hours. If you did not request this, no action is needed and weekly email will not begin. Joining a Circle or creating an account does not subscribe you. Your other email choices remain unchanged.`;
 const network=request.headers.get('x-forwarded-for')?.split(',')[0].trim(),hashedNetwork=network?createHmac('sha256',process.env.SUPABASE_SERVICE_ROLE_KEY!).update('waypoint-confirm:'+network).digest('hex'):null;
 must(await createSupabaseAdminClient().rpc('dydd_request_waypoint_confirmation',{recipient:email,user_key:user?.email_confirmed_at&&user.email?.toLowerCase()===email?user.id:null,hashed_token:tokenHash(token),hashed_network:hashedNetwork,sender_payload:{to:email,subject,text,html:lifecycleHtml(subject,text),idempotencyKey:key}}));
 return NextResponse.json({message:process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT==='sandbox'?'Sandbox request saved. No confirmation email has been sent.':'If your request can be confirmed, a confirmation link will arrive shortly. Weekly Waypoints begin only after you confirm.'},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({message:'Your subscription request could not be saved. Please try again.'},{status:503});}
}
