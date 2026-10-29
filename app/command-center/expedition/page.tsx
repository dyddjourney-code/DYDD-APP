import { ExpeditionDemo } from "@/components/expedition-demo";
import { redirect } from "next/navigation";
import { isDyddAdminEmail } from "@/lib/admin-access";
import { isOwnerPreviewRequest } from "@/lib/owner-preview";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ExpeditionPageProps = {
  searchParams?: Promise<{
    key?: string;
    review?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function ExpeditionPage({ searchParams }: ExpeditionPageProps) {
  const params = await searchParams;
  const isOwnerPreview = isOwnerPreviewRequest(params);
  const serverSupabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();

  if (!user && !isOwnerPreview) {
    redirect(`/login?next=${encodeURIComponent("/command-center/expedition")}`);
  }

  const isAdmin = isOwnerPreview || isDyddAdminEmail(user?.email);

  if (!isAdmin) {
    redirect("/command-center");
  }

  return (
    <main className="command-center-shell expedition-page-shell">
      <section className="expedition-page-hero" aria-labelledby="expedition-title">
        <figure className="expedition-header-art">
          <img
            src="/brand/expedition-team-climb-cartoon-header.png"
            alt="Illustrated leadership expedition team preparing for a mountain ascent"
            width={2073}
            height={758}
          />
        </figure>
        <div className="expedition-header-copy">
          <h1 id="expedition-title">Expedition</h1>
          <p>
            A premium team and leadership avenue for Christian organizations that need discovery,
            alignment, formation, and Kingdom-impact follow-through.
          </p>
        </div>
      </section>

      <ExpeditionDemo />
    </main>
  );
}
