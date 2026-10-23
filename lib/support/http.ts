import { NextResponse } from "next/server";

export const supportHeaders = { "Cache-Control": "private, no-store, max-age=0", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" };
export function reply(body: unknown, status = 200) { return NextResponse.json(body, { status, headers: supportHeaders }); }
export function sameOrigin(request: Request) {
  return request.headers.get("origin") === new URL(request.url).origin && !["cross-site", "same-site"].includes(request.headers.get("sec-fetch-site") ?? "");
}
export async function readInput(request: Request): Promise<Record<string, unknown> | null> {
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json") return null;
  if (Number(request.headers.get("content-length")) > 20000) return null;
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.length; if (size > 20000) { await reader.cancel(); return null; } chunks.push(value);
    }
    const value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    return value && typeof value === "object" && !Array.isArray(value) ? value : null;
  } catch { return null; }
}
