import { handleSandboxAuthEmail } from '@/lib/email/sandbox-auth';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  return handleSandboxAuthEmail(request);
}
