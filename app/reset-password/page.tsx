import Link from "next/link";
import { updatePassword } from "@/app/login/actions";

type ResetPasswordPageProps = {
  searchParams?: Promise<{
    message?: string;
    next?: string;
  }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const message = params?.message;
  const next = params?.next?.startsWith("/") ? params.next : "/hq";

  return (
    <main className="login-shell fruitlife-access-shell">
      <section className="login-copy">
        <Link className="text-link" href="/">
          Discover Your Divine Design
        </Link>
        <p className="eyebrow">Account security</p>
        <h1>Set a new password.</h1>
        <p className="lede">
          Use the reset link from your email, then return to your account with
          your new password.
        </p>
      </section>

      <section className="login-panel" aria-label="Set new password">
        <div>
          <p className="section-label">Password</p>
          <h2>Choose a new password</h2>
          <p className="helper-text">Use at least 8 characters.</p>
        </div>
        <form action={updatePassword} className="auth-form">
          <input name="next" type="hidden" value={next} />
          <label htmlFor="password">New password</label>
          <input
            autoComplete="new-password"
            id="password"
            minLength={8}
            name="password"
            required
            type="password"
          />
          <label htmlFor="confirm-password">Confirm new password</label>
          <input
            autoComplete="new-password"
            id="confirm-password"
            minLength={8}
            name="confirm_password"
            required
            type="password"
          />
          <button className="button primary" type="submit">
            Save password
          </button>
        </form>
        {message ? <p className="status-note">{message}</p> : null}
      </section>
    </main>
  );
}
