import {NextResponse} from 'next/server';
import {createSupabaseAdminClient} from '@/lib/supabase/admin';
import {must,tokenHash} from '@/lib/lifecycle/store';
export const dynamic='force-dynamic';
export async function POST(request:Request){try{
 const b=await request.json();if(!/^[a-f0-9]{64}$/.test(b.token||''))return NextResponse.json({error:'This confirmation link is not valid.'},{status:400});
 const confirmed=must(await createSupabaseAdminClient().rpc('dydd_confirm_waypoint_subscription',{hashed_token:tokenHash(b.token)}));
 return NextResponse.json(confirmed?{confirmed:true,message:'Your Waypoint subscription is confirmed. Weekly email follows the next Friday release; past issues will not be backfilled. Your other email choices are unchanged.'}:{error:'This confirmation link has expired or was not found. Request a fresh link from Waypoints.'},{status:confirmed?200:410,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
 }catch{return NextResponse.json({error:'Confirmation could not be saved. Please try again.'},{status:503});}}
