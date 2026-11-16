import { NextRequest, NextResponse } from 'next/server';
import { guestAccessTarget } from '../enrollment';

/** A document POST/303 handoff must not depend on React's action/router transition.
 * The pass and session capabilities remain in the existing HttpOnly cookie flow.
 */
export async function POST(request: NextRequest) {
  // Match the same-origin protection provided by Server Actions. Never accept a
  // cross-site form that could overwrite a browser's private guest-session cookie.
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) {
    return new NextResponse('Open this guest pass directly and try again.', { status: 403 });
  }
  const target = await guestAccessTarget(await request.formData());
  const response = NextResponse.redirect(new URL(target, request.url), 303);
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}
