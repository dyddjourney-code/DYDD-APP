import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { getPdfMonkeyDocument } from "@/lib/pdfmonkey/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

type SpiritualGiftsPdfMetadata = {
  documentId?: string;
  providerUrl?: string;
};

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session") ?? "";
  const token = request.nextUrl.searchParams.get("token") ?? "";

  if (!sessionId || !token) {
    return NextResponse.json({ error: "Missing Spiritual Gifts report token." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: session } = await supabase
    .from("spiritual_gifts_sessions")
    .select("id,intake_token_hash,metadata")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session || session.intake_token_hash !== hashToken(token)) {
    return NextResponse.json({ error: "This Spiritual Gifts report link is not valid." }, { status: 404 });
  }

  const metadata = (session.metadata ?? {}) as Record<string, unknown>;
  const pdfMonkey = (metadata.pdfMonkey ?? {}) as SpiritualGiftsPdfMetadata;

  if (!pdfMonkey.providerUrl && !pdfMonkey.documentId) {
    return NextResponse.json({ error: "The Spiritual Gifts PDF report is not ready yet." }, { status: 404 });
  }

  if (pdfMonkey.documentId) {
    const document = await getPdfMonkeyDocument(pdfMonkey.documentId);
    const freshUrl = document.public_share_link ?? document.download_url ?? document.preview_url ?? "";

    if (freshUrl) {
      if (freshUrl !== pdfMonkey.providerUrl) {
        await supabase
          .from("spiritual_gifts_sessions")
          .update({
            metadata: {
              ...metadata,
              pdfMonkey: {
                ...pdfMonkey,
                providerUrl: freshUrl,
                refreshedAt: new Date().toISOString(),
                status: document.status ?? null,
              },
            },
          })
          .eq("id", sessionId);
      }

      return NextResponse.redirect(freshUrl);
    }
  }

  return NextResponse.redirect(String(pdfMonkey.providerUrl));
}
