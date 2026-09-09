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
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type SpiritualGiftsPageProps = {
  searchParams?: Promise<{
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
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (channel === "app" && !user && !reviewIdentity) {
    redirect("/login?message=Sign in before starting your app-linked Spiritual Gifts assessment.");
  }

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
    : reviewIdentity ?? undefined;

  return (
    <main className="fruitlife-shell fruitlife-public spiritual-gifts-shell spiritual-gifts-standalone">
      <SpiritualGiftsAssessmentForm
        action={saveSpiritualGiftsPublicResponse}
        channel={channel}
        initialReviewer={reviewer}
        message={params?.message}
        reviewKey={reviewIdentity ? params?.key : undefined}
        reviewMode={reviewIdentity ? params?.review : undefined}
      />
    </main>
  );
}
