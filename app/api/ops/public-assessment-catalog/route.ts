import {timingSafeEqual} from 'node:crypto';
import {verifyAssessmentLiveStripeCatalog} from '@/lib/public-assessments/runtime-catalog';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export async function GET(request: Request) {
 const secret = process.env.CRON_SECRET;
 const supplied = Buffer.from(request.headers.get('authorization') || '');
 const expected = Buffer.from(`Bearer ${secret || ''}`);
 const headers = {'Cache-Control':'private, no-store'};
 if (!secret || supplied.length !== expected.length || !timingSafeEqual(supplied, expected))
  return Response.json({ok:false},{status:401,headers});
 return Response.json(await verifyAssessmentLiveStripeCatalog(), {headers});
}
