import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isReviewRequest } from "@/lib/review/heather";
import { isOwnerPreviewRequest } from "@/lib/owner-preview";
export async function circleActor(request: Request) {
  const url = new URL(request.url);
  const p = {
    review: url.searchParams.get("review") || undefined,
    key: url.searchParams.get("key") || undefined,
  };
  if (isOwnerPreviewRequest(p) || isReviewRequest(p))
    return { userId: null, previewScope: p.review! };
  const s = await createSupabaseServerClient();
  const {
    data: { user },
  } = await s.auth.getUser();
  return user ? { userId: user.id, previewScope: null } : null;
}
export function circleQuery(actor: {
  userId: string | null;
  previewScope: string | null;
}) {
  const q = createSupabaseAdminClient()
    .from("journey_circle_plans")
    .select("id,status,plan,revision,updated_at");
  return actor.userId
    ? q.eq("user_id", actor.userId)
    : q.eq("preview_scope", actor.previewScope!);
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}
