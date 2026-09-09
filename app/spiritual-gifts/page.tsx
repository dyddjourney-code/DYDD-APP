import { SpiritualGiftsAssessmentForm } from "./assessment-form";
import { saveSpiritualGiftsPublicResponse } from "./actions";
import {
  heatherReviewEmail,
  heatherReviewName,
  isHeatherReviewRequest,
  isNewReviewRequest,
  jordanReviewEmail,
  jordanReviewName,
} from "@/lib/review/heather";
import { verifySpiritualGiftsAppIdentity } from "@/lib/spiritual-gifts/app-identity";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SpiritualGiftsPageProps = {
  searchParams?: Promise<{
    app_email?: string;
    app_name?: string;
    app_sig?: string;
    channel?: string;
    key?: string;
    message?: string;
    review?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function SpiritualGiftsPage({ searchParams }: SpiritualGiftsPageProps) {
  const params = await searchParams;
  const channel = params?.channel === "app" ? "app" : "public";
  const reviewIdentity = isHeatherReviewRequest(params)
    ? { email: heatherReviewEmail, name: heatherReviewName }
    : isNewReviewRequest(params)
      ? { email: jordanReviewEmail, name: jordanReviewName }
      : null;
  const appIdentity =
    channel === "app"
      ? verifySpiritualGiftsAppIdentity({
          email: params?.app_email,
          name: params?.app_name,
          signature: params?.app_sig,
        })
      : null;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("school_profiles")
        .select("full_name,email")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };
  const authDisplayName = String(user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? "").trim();
  const reviewer = user
    ? {
        email: profile?.email ?? user.email ?? "",
        name: profile?.full_name?.trim() || authDisplayName || user.email?.split("@")[0] || "",
      }
    : reviewIdentity ?? appIdentity ?? undefined;

  return (
    <main className="fruitlife-shell fruitlife-public spiritual-gifts-shell spiritual-gifts-standalone">
      <SpiritualGiftsAssessmentForm
        action={saveSpiritualGiftsPublicResponse}
        channel={channel}
        identitySignature={appIdentity?.signature}
        initialReviewer={reviewer}
        message={params?.message}
        reviewKey={reviewIdentity ? params?.key : undefined}
        reviewMode={reviewIdentity ? params?.review : undefined}
      />
    </main>
  );
}
