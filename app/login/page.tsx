import Link from "next/link";
import { signInWithMagicLink } from "./actions";

type LoginPageProps = {
  searchParams?: Promise<{
    message?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const message = params?.message;

  return (
    <main className="login-shell">
      <section className="login-copy">
        <Link className="text-link" href="/">
          Discover Your Divine Design
        </Link>
        <p className="eyebrow">DYDD HQ access</p>
        <h1>Enter the headquarters.</h1>
        <p className="lede">
          Sign in to continue the DYDD Journey, collect your artifacts, and
          prepare for companion-guided reflection around your design.
        </p>
      </section>

      <section className="login-panel" aria-label="Sign in">
        <div>
          <p className="section-label">Secure sign in</p>
          <h2>Magic link</h2>
        </div>
        <form action={signInWithMagicLink} className="auth-form">
          <label htmlFor="email">Email address</label>
          <input
            autoComplete="email"
            id="email"
            name="email"
            placeholder="you@example.com"
            required
            type="email"
          />
          <p className="helper-text">
            Supabase sends the sign-in link. No password is required for this
            first version.
          </p>
          <button className="button primary" type="submit">
            Send sign-in link
          </button>
        </form>
        {message ? <p className="status-note">{message}</p> : null}
      </section>
    </main>
  );
}
