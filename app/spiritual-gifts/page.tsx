import { SpiritualGiftsAssessmentForm } from "./assessment-form";
import { saveSpiritualGiftsPublicResponse } from "./actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type SpiritualGiftsPageProps = {
  searchParams?: Promise<{
    channel?: string;
    message?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function SpiritualGiftsPage({ searchParams }: SpiritualGiftsPageProps) {
  const params = await searchParams;
  const channel = params?.channel === "app" ? "app" : "public";
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (channel === "app" && !user) {
    redirect("/login?message=Sign in before starting your app-linked Spiritual Gifts assessment.");
  }

  const { data: profile } = user
    ? await supabase
        .from("school_profiles")
        .select("full_name,email")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };
  const reviewer = user
    ? {
        email: profile?.email ?? user.email ?? "",
        name: profile?.full_name ?? user.email?.split("@")[0] ?? "",
      }
    : undefined;

  return (
    <main className="fruitlife-shell fruitlife-public spiritual-gifts-shell spiritual-gifts-standalone">
      <SpiritualGiftsAssessmentForm
        action={saveSpiritualGiftsPublicResponse}
        channel={channel}
        initialReviewer={reviewer}
        message={params?.message}
      />
    </main>
  );
}
