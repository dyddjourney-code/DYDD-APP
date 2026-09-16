import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function FruitLifeEntryPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const fruitLifeBaseCampPath = "/hq?lane=fruitlife";
  const accessHref = user
    ? fruitLifeBaseCampPath
    : `/login?next=${encodeURIComponent(fruitLifeBaseCampPath)}`;

  return (
    <main className="fruitlife-shell fruitlife-public fruitlife-entry-shell">
      <section className="fruitlife-entry-gate" aria-label="FruitLife 360 entry">
        <div className="fruitlife-entry-copy">
          <img
            className="fruitlife-entry-logo"
            src="/brand/tools/fruitful-life-360-logo.jpg"
            alt="FruitLife 360"
          />
          <h1>FruitLife 360</h1>
          <p className="lede">
            Set up an account to access your FruitLife 360 report process,
            including observer invitations, live completion tracking, reminder
            links, and report development.
          </p>
          <p>
            Your account keeps the process connected to you so you can return
            to your dashboard while responses come in.
          </p>
          <Link
            className="button primary fruitlife-entry-primary"
            href={accessHref}
          >
            {user ? "Continue to FruitLife 360" : "Create account or sign in"}
          </Link>
        </div>
        <img
          className="fruitlife-entry-signpost"
          src="/brand/trailheads/fruitlife-360-signpost.png"
          alt=""
        />
      </section>

      <footer className="fruitlife-entry-footer">
        <img src="/brand/dydd-logo.webp" alt="Discover Your Divine Design" />
        <p>
          Discover Your Divine Design helps people recognize how God has shaped
          their identity, gifting, story, desire, expertise, and purpose so they
          can serve with clarity.
        </p>
      </footer>
    </main>
  );
}
