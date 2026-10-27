import {timingSafeEqual} from 'node:crypto';
import {NextResponse} from 'next/server';
import {runWaypointsWorker} from '@/lib/lifecycle/waypoints-worker';
import {runLifecycleWorker} from '@/lib/lifecycle/worker';
export const dynamic='force-dynamic';
export const maxDuration=300;
export async function GET(request:Request){
 const expected=process.env.DYDD_LIFECYCLE_CRON_SECRET||process.env.CRON_SECRET,received=request.headers.get('authorization')||'';
 if(!expected||Buffer.byteLength(received)!==Buffer.byteLength('Bearer '+expected)||!timingSafeEqual(Buffer.from(received),Buffer.from('Bearer '+expected)))return NextResponse.json({error:'Unauthorized'},{status:401});
 try{const lifecycle=await runLifecycleWorker();const waypointResponse=await runWaypointsWorker();if(!waypointResponse.ok)throw Error('Waypoint worker needs retry.');const waypoints=await waypointResponse.json();return NextResponse.json({...lifecycle,waypoints},{headers:{'Cache-Control':'no-store'}});}catch{return NextResponse.json({error:'Lifecycle storage unavailable; no messages were released.'},{status:503});}
}
export const POST=GET;
