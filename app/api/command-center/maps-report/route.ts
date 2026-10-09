import { NextResponse, type NextRequest } from "next/server";
import { isDyddAdminEmail } from "@/lib/admin-access";
import { sendResendEmail } from "@/lib/email/resend";
import {
  buildMapsRoadmapHtml,
  cleanMapsFilename,
  hasMapsReportInputs,
  latestMapsSnapshot,
  participantFromSnapshots,
  type MapsAssessmentParticipant,
  type MapsAssessmentSnapshot,
} from "@/lib/maps-report/report";
import { isOwnerPreviewRequest } from "@/lib/owner-preview";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 120;

type CommandCenterActor = {
  isAdmin: boolean;
};

function commandCenterRedirect(request: NextRequest, message: string, group?: string) {
  const url = new URL("/command-center", request.url);
  const review = request.nextUrl.searchParams.get("review");
  const key = request.nextUrl.searchParams.get("key");

  if (review === "owner" && key) {
    url.searchParams.set("review", review);
    url.searchParams.set("key", key);
  }

  if (group) url.searchParams.set("group", group);
  url.searchParams.set("message", message);

  return NextResponse.redirect(url);
}

async function getActor(request: NextRequest): Promise<CommandCenterActor | null> {
  if (isOwnerPreviewRequest(Object.fromEntries(request.nextUrl.searchParams))) {
    return { isAdmin: true };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return {
    isAdmin: isDyddAdminEmail(user.email),
  };
}

async function requireAdminActor(request: NextRequest) {
  const actor = await getActor(request);
  if (!actor) {
    return {
      actor: null,
      response: NextResponse.redirect(
        new URL(`/login?next=${encodeURIComponent("/command-center")}`, request.url),
      ),
    };
  }

  if (!actor.isAdmin) {
    return {
      actor: null,
      response: NextResponse.json({ error: "MAPS Roadmap generation is admin-only." }, { status: 403 }),
    };
  }

  return { actor, response: null };
}

async function fetchParticipantSnapshots(participantId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("assessment_snapshots")
    .select(
      "id,assessment_type,created_at,participant_id,scores,source_submitted_at,assessment_participants(id,display_name,normalized_email)",
    )
    .eq("participant_id", participantId)
    .in("assessment_type", ["designid", "designpd"])
    .order("source_submitted_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as MapsAssessmentSnapshot[];
}

async function fetchGroupParticipantIds(groupId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("assessment_group_members")
    .select("participant_id")
    .eq("group_id", groupId)
    .eq("membership_status", "active");

  if (error) throw new Error(error.message);

  return [...new Set((data ?? []).map((item) => String(item.participant_id)).filter(Boolean))];
}

function buildReportInput(participantId: string, snapshots: MapsAssessmentSnapshot[]) {
  const designIdSnapshot = latestMapsSnapshot(snapshots, "designid");
  const designPdSnapshot = latestMapsSnapshot(snapshots, "designpd");
  const participant = participantFromSnapshots(snapshots) ?? {
    display_name: "Participant",
    id: participantId,
    normalized_email: null,
  };

  if (!designIdSnapshot || !designPdSnapshot) return null;

  return {
    designIdSnapshot,
    designPdSnapshot,
    participant,
  };
}

async function renderPdf(html: string) {
  const chromium = await import("@sparticuz/chromium");
  const puppeteer = await import("puppeteer-core");
  const executablePath = await chromium.default.executablePath();
  const browser = await puppeteer.default.launch({
    args: chromium.default.args,
    defaultViewport: { height: 1100, width: 850 },
    executablePath,
    headless: true,
  });

  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(45000);
    await page.setContent(html, { timeout: 45000, waitUntil: "load" });
    await page.emulateMediaType("print");
    const pdf = await page.pdf({
      format: "letter",
      margin: { bottom: "0.25in", left: "0.25in", right: "0.25in", top: "0.25in" },
      preferCSSPageSize: true,
      printBackground: true,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

async function pdfResponse({
  html,
  participant,
}: {
  html: string;
  participant: MapsAssessmentParticipant;
}) {
  const pdf = await renderPdf(html);
  const filename = `${cleanMapsFilename(participant.display_name ?? participant.normalized_email ?? "Participant")} - MAPS Roadmap.pdf`;

  return new NextResponse(pdf, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "application/pdf",
    },
  });
}

export async function GET(request: NextRequest) {
  const { response } = await requireAdminActor(request);
  if (response) return response;

  const participantId = request.nextUrl.searchParams.get("participant") ?? "";
  const format = request.nextUrl.searchParams.get("format") ?? "pdf";

  if (!participantId) {
    return NextResponse.json({ error: "Missing participant." }, { status: 400 });
  }

  const snapshots = await fetchParticipantSnapshots(participantId);
  const input = buildReportInput(participantId, snapshots);

  if (!input) {
    return NextResponse.json(
      { error: "This person needs both DesignID and DesignPD snapshots before MAPS can be generated." },
      { status: 409 },
    );
  }

  const html = buildMapsRoadmapHtml(input);

  if (format === "html") {
    return new NextResponse(html, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  }

  return pdfResponse({
    html,
    participant: input.participant,
  });
}

async function sendMapsEmail({
  participant,
  pdf,
  to,
}: {
  participant: MapsAssessmentParticipant;
  pdf: Buffer;
  to?: string;
}) {
  const email = to ?? participant.normalized_email ?? "";
  const name = participant.display_name ?? email;
  const filename = `${cleanMapsFilename(name)} - MAPS Roadmap.pdf`;

  if (!email || !email.includes("@")) {
    return {
      message: `${name} does not have a valid email address.`,
      sent: false,
      skipped: true,
    };
  }

  return sendResendEmail({
    attachments: [
      {
        content: Buffer.from(pdf).toString("base64"),
        filename,
      },
    ],
    html: [
      `<p>Hi ${name},</p>`,
      "<p>Your MAPS Personal Roadmap is attached.</p>",
      "<p>This report connects your DesignID and DesignPD results to the MAPS project-walk framework.</p>",
      "<p>Sincerely,<br>Discover Your Divine Design Team</p>",
    ].join(""),
    subject: "Your MAPS Personal Roadmap",
    text: `Hi ${name},\n\nYour MAPS Personal Roadmap is attached.\n\nSincerely,\nDiscover Your Divine Design Team`,
    to: email,
  });
}

export async function POST(request: NextRequest) {
  const { response } = await requireAdminActor(request);
  if (response) return response;

  const formData = await request.formData();
  const participantId = String(formData.get("participant") ?? "").trim();
  const groupId = String(formData.get("group") ?? "").trim();
  const to = String(formData.get("to") ?? "").trim();

  try {
    if (groupId) {
      const participantIds = await fetchGroupParticipantIds(groupId);
      let sent = 0;
      let skipped = 0;
      let failed = 0;

      for (const id of participantIds) {
        const snapshots = await fetchParticipantSnapshots(id);
        if (!hasMapsReportInputs(snapshots)) {
          skipped += 1;
          continue;
        }

        const input = buildReportInput(id, snapshots);
        if (!input) {
          skipped += 1;
          continue;
        }

        const html = buildMapsRoadmapHtml(input);
        const pdf = await renderPdf(html);
        const result = await sendMapsEmail({
          participant: input.participant,
          pdf: Buffer.from(pdf),
        });

        if (result.sent) sent += 1;
        else if (result.skipped) skipped += 1;
        else failed += 1;
      }

      return commandCenterRedirect(
        request,
        `MAPS group send complete. Sent ${sent}; skipped ${skipped}; failed ${failed}.`,
        groupId,
      );
    }

    if (!participantId) {
      return commandCenterRedirect(request, "Choose a participant before sending a MAPS report.");
    }

    const snapshots = await fetchParticipantSnapshots(participantId);
    const input = buildReportInput(participantId, snapshots);

    if (!input) {
      return commandCenterRedirect(
        request,
        "This person needs both DesignID and DesignPD snapshots before MAPS can be emailed.",
      );
    }

    const html = buildMapsRoadmapHtml(input);
    const pdf = await renderPdf(html);
    const result = await sendMapsEmail({
      participant: input.participant,
      pdf: Buffer.from(pdf),
      to: to || undefined,
    });

    return commandCenterRedirect(
      request,
      result.sent
        ? `MAPS report emailed to ${to || input.participant.normalized_email}.`
        : result.message ?? "Unable to send MAPS report email.",
    );
  } catch (error) {
    return commandCenterRedirect(
      request,
      error instanceof Error ? error.message : "Unable to generate MAPS report.",
      groupId || undefined,
    );
  }
}
