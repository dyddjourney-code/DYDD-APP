import Link from "next/link";
import { signInWithMagicLink, verifyEmailCode } from "./actions";

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

      <section className="login-panel" aria-label="Request sign-in link">
        <div>
          <p className="section-label">Step one</p>
          <h2>Request access</h2>
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
            Supabase sends a sign-in email. If the link does not open the HQ,
            use the 6-digit code from that same email below.
          </p>
          <button className="button primary" type="submit">
            Send sign-in email
          </button>
        </form>
        {message ? <p className="status-note">{message}</p> : null}
      </section>

      <section className="login-panel code-panel" aria-label="Enter email code">
        <div>
          <p className="section-label">Step two</p>
          <h2>Enter email code</h2>
        </div>
        <form action={verifyEmailCode} className="auth-form">
          <label htmlFor="code-email">Email address</label>
          <input
            autoComplete="email"
            id="code-email"
            name="email"
            placeholder="willoughby.h.s@gmail.com"
            required
            type="email"
          />
          <label htmlFor="token">6-digit code</label>
          <input
            autoComplete="one-time-code"
            id="token"
            inputMode="numeric"
            maxLength={6}
            name="token"
            pattern="[0-9]{6}"
            placeholder="123456"
            required
            type="text"
          />
          <p className="helper-text">
            This is the more reliable review path when the email link opens in
            Telegram, a different browser, or a private tab.
          </p>
          <button className="button primary" type="submit">
            Enter HQ
          </button>
        </form>
      </section>
    </main>
  );
}
