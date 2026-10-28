import { createHmac } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { readInput, reply, sameOrigin } from "@/lib/support/http";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return reply({ error: "Open Contact on this website to send a request." }, 403);
  const input = await readInput(request);
  if (!input) return reply({ error: "Check your request details and try again." }, 400);
  const text = (key: string) => typeof input[key] === "string" ? (input[key] as string).trim() : "";
  const name = text("name"), email = text("email").toLowerCase(), subject = text("subject"), message = text("message");
  if (!name || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || subject.length < 3 || subject.length > 160 || message.length < 10 || message.length > 5000 || [name,email,subject].some(v => /[\r\n\x00-\x1f]/.test(v)) || /\x00/.test(message)) return reply({ error: "Enter your name, a valid email, a subject (3–160 characters), and a message (10–5,000 characters)." }, 400);
  if (text("website")) return reply({ received: true }, 201);
  try {
    const db = createSupabaseAdminClient();
    // Only Vercel's overwritten proxy header is trusted. Other hosts share a
    // conservative bucket; arbitrary client-supplied forwarding headers cannot bypass it.
    const network = process.env.VERCEL === "1" ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim() || "unknown" : "self-hosted";
    const hash = (value: string) => createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY!).update(value).digest("hex");
    const { data, error } = await db.rpc("submit_support_request", { p_name: name, p_email: email, p_subject: subject, p_message: message, p_email_key: hash(`email:${email}`), p_network_key: hash(`network:${network}`) });
    if (error) return reply({ error: "Your request could not be saved. Your message is still here; please try again." }, 503);
    if (!data) return reply({ error: "Too many requests. Please wait an hour before trying again." }, 429);
    return reply({ received: true, reference: data }, 201);
  } catch { return reply({ error: "Support is temporarily unavailable. Your message is still here; please try again." }, 503); }
}
