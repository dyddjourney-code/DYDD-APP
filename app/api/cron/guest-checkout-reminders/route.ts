import {timingSafeEqual} from 'node:crypto';
import {NextResponse} from 'next/server';
import {runGuestCheckoutReminderWorker} from '@/lib/public-assessments/guest-checkout-reminder';
export const dynamic='force-dynamic';
export const maxDuration=300;
export async function GET(request:Request) {
 const expected=process.env.CRON_SECRET,received=request.headers.get('authorization')||'';
 if(!expected||Buffer.byteLength(received)!==Buffer.byteLength('Bearer '+expected)||!timingSafeEqual(Buffer.from(received),Buffer.from('Bearer '+expected)))return NextResponse.json({error:'Unauthorized'},{status:401});
 try{return NextResponse.json(await runGuestCheckoutReminderWorker(),{headers:{'Cache-Control':'no-store'}});}
 catch{return NextResponse.json({error:'Guest reminder storage unavailable.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
