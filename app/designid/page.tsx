import Link from "next/link";
import { isDyddAdminEmail } from "@/lib/admin-access";
import { getDesignIdEligibility } from "@/lib/designid/retake";
import { redirect } from "next/navigation";
import { normalizeEmail } from "@/lib/identity/email";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { saveDesignIdResponse } from "./actions";
import { DesignIdAssessmentForm } from "./assessment-form";

type DesignIdPageProps = {
  searchParams?: Promise<{
    message?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function DesignIdPage({ searchParams }: DesignIdPageProps) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/designid")}`);
  }

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("school_profiles")
    .select("full_name,email")
    .eq("id", user.id)
    .maybeSingle();
  const authDisplayName = String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? "").trim();
  const reviewer = {
    email: normalizeEmail(user.email),
    name: profile?.full_name?.trim() || authDisplayName || user.email?.split("@")[0] || "DesignID Participant",
  };

  const eligibility = await getDesignIdEligibility(user.id, reviewer.email, isDyddAdminEmail(user.email));
  if (!eligibility.allowed) return <main className="fruitlife-shell fruitlife-public designid-shell"><section className="fruitlife-panel fruitlife-message-card">
    <h1>Keep exploring your design.</h1>
    <p>Your design is something to understand and live out—not continually retest. Explore your report and put its insights into practice.</p>
    <p>Your next assessment is available on <strong>{eligibility.nextEligibleLabel}</strong>.</p>
    <Link className="button primary" href="/field-kit">Open Field Kit</Link>
  </section></main>;

  return (
    <main className="fruitlife-shell fruitlife-public designid-shell">
      <DesignIdAssessmentForm
        action={saveDesignIdResponse}
        initialReviewer={reviewer}
        message={params?.message}
      />
    </main>
  );
}
