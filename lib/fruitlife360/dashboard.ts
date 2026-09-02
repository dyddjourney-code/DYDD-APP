import { displayDate } from "@/lib/assessments/student-context";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type FruitLifeDashboardSession = {
  artifacts: Array<{
    artifact_status: string;
    artifact_type: string;
    created_at: string;
    external_url: string | null;
    filename: string | null;
    provider: string;
  }>;
  created_at: string;
  id: string;
  invites: Array<{
    completed_at: string | null;
    id: string;
    invite_status: string;
    observer_email: string | null;
    observer_name: string | null;
    relationship_label: string | null;
  }>;
  metadata: {
    observerLinks?: Array<{ email?: string; link?: string; name?: string; relationship?: string }>;
    selfLink?: string;
  } | null;
  observer_completed_count: number;
  observer_goal: number;
  participant_email: string | null;
  participant_name: string | null;
  report_status: string;
  report_url: string | null;
  response_count: number;
  self_completed_at: string | null;
  session_status: string;
  updated_at: string;
};

export function getFruitLifeCompletion(session: FruitLifeDashboardSession | null) {
  if (!session) {
    return { completed: 0, required: 1 };
  }

  const selfCount = session.self_completed_at ? 1 : 0;
  const required = 1 + Math.max(0, session.observer_goal);
  const completed = selfCount + Math.max(0, session.observer_completed_count);

  return { completed, required };
}

export function titleizeFruitLifeStatus(value: string | null | undefined) {
  return value ? value.replace(/_/g, " ") : "not started";
}

export function fruitLifeTokenFromSession(session: FruitLifeDashboardSession | null) {
  if (!session?.metadata?.selfLink) {
    return "";
  }

  try {
    return new URL(session.metadata.selfLink).searchParams.get("token") ?? "";
  } catch {
    return "";
  }
}

export function fruitLifeStatusHref(session: FruitLifeDashboardSession, token: string) {
  if (!token) {
    return "/fruitlife360";
  }

  return `/fruitlife360/status?session=${encodeURIComponent(session.id)}&token=${encodeURIComponent(token)}`;
}

export function fruitLifeReportHref(session: FruitLifeDashboardSession) {
  return `/fruitlife360/report?session=${encodeURIComponent(session.id)}`;
}

export function fruitLifeIsActive(session: FruitLifeDashboardSession | null) {
  if (!session) {
    return false;
  }

  return !["report_ready", "report_sent", "completed", "sent", "archived"].includes(
    session.session_status,
  );
}

export function fruitLifeReportArtifact(session: FruitLifeDashboardSession | null) {
  return session?.artifacts.find(
    (artifact) => artifact.artifact_type === "pdf" && artifact.artifact_status === "ready",
  );
}

export function fruitLifePayloadArtifact(session: FruitLifeDashboardSession | null) {
  return session?.artifacts.find((artifact) => artifact.artifact_type === "payload");
}

export function fruitLifeArtifactTitle(session: FruitLifeDashboardSession) {
  return `FruitLife 360 Report - ${displayDate(session.updated_at ?? session.created_at)}`;
}

export async function getFruitLifeDashboardSessions({
  email,
  enabled,
  isAdmin = false,
}: {
  email: string | null;
  enabled: boolean;
  isAdmin?: boolean;
}) {
  if (!enabled || (!email && !isAdmin)) {
    return [];
  }

  const supabaseAdmin = createSupabaseAdminClient();
  let query = supabaseAdmin
    .from("fruitlife_360_sessions")
    .select(
      "id,metadata,participant_name,participant_email,session_status,report_status,observer_goal,observer_completed_count,response_count,self_completed_at,report_url,created_at,updated_at",
    )
    .order("updated_at", { ascending: false })
    .limit(isAdmin ? 12 : 8);

  if (!isAdmin && email) {
    query = query.eq("participant_email", email);
  }

  const { data } = await query;
  const sessions = (data ?? []) as Omit<FruitLifeDashboardSession, "artifacts" | "invites">[];
  const sessionIds = sessions.map((session) => session.id);

  if (!sessionIds.length) {
    return [];
  }

  const [{ data: artifacts }, { data: invites }] = await Promise.all([
    supabaseAdmin
      .from("fruitlife_360_report_artifacts")
      .select("session_id,artifact_type,artifact_status,provider,external_url,filename,created_at")
      .in("session_id", sessionIds)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("fruitlife_360_observer_invites")
      .select("session_id,id,observer_name,observer_email,relationship_label,invite_status,completed_at")
      .in("session_id", sessionIds)
      .order("created_at", { ascending: true }),
  ]);

  const artifactsBySession = new Map<string, FruitLifeDashboardSession["artifacts"]>();
  const invitesBySession = new Map<string, FruitLifeDashboardSession["invites"]>();

  for (const artifact of artifacts ?? []) {
    const sessionId = String(artifact.session_id);
    const current = artifactsBySession.get(sessionId) ?? [];
    current.push({
      artifact_status: String(artifact.artifact_status),
      artifact_type: String(artifact.artifact_type),
      created_at: String(artifact.created_at),
      external_url: typeof artifact.external_url === "string" ? artifact.external_url : null,
      filename: typeof artifact.filename === "string" ? artifact.filename : null,
      provider: String(artifact.provider),
    });
    artifactsBySession.set(sessionId, current);
  }

  for (const invite of invites ?? []) {
    const sessionId = String(invite.session_id);
    const current = invitesBySession.get(sessionId) ?? [];
    current.push({
      completed_at: typeof invite.completed_at === "string" ? invite.completed_at : null,
      id: String(invite.id),
      invite_status: String(invite.invite_status ?? "draft"),
      observer_email: typeof invite.observer_email === "string" ? invite.observer_email : null,
      observer_name: typeof invite.observer_name === "string" ? invite.observer_name : null,
      relationship_label:
        typeof invite.relationship_label === "string" ? invite.relationship_label : null,
    });
    invitesBySession.set(sessionId, current);
  }

  return sessions.map((session) => ({
    ...session,
    artifacts: artifactsBySession.get(session.id) ?? [],
    invites: invitesBySession.get(session.id) ?? [],
  }));
}
