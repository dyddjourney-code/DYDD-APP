import Link from "next/link";
import {
  createPasswordAccount,
  requestPasswordReset,
  signInWithPassword,
} from "./actions";

type LoginPageProps = {
  searchParams?: Promise<{
    message?: string;
    mode?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const message = params?.message;
  const next = params?.next?.startsWith("/") ? params.next : "/hq";
  const mode = params?.mode === "signup" || params?.mode === "recovery"
    ? params.mode
    : "signin";
  const isFruitLifeAccess =
    next.includes("lane=fruitlife") || next.startsWith("/fruitlife360");
  const isSpiritualGiftsAccess = next.startsWith("/spiritual-gifts");
  const isCommandCenterAccess = next.startsWith("/command-center");
  const isMiniAppAccess = isFruitLifeAccess || isSpiritualGiftsAccess;
  const accessTitle = isSpiritualGiftsAccess
    ? "Spiritual Gifts access"
    : isFruitLifeAccess
      ? "FruitLife 360 access"
      : isCommandCenterAccess
        ? "Owner Command Center access"
        : "DYDD Journey access";
  const accessHeading = isMiniAppAccess
    ? isSpiritualGiftsAccess
      ? "Create your Spiritual Gifts account."
      : "Create your FruitLife 360 account."
    : isCommandCenterAccess
      ? "Open the Command Center."
      : "Enter your DYDD account.";
  const accessCopy = isMiniAppAccess
    ? isSpiritualGiftsAccess
      ? "Use an email and password so your free Spiritual Gifts report, course access, and future DYDD app history stay connected."
      : "Use an email and password so you can return to your FruitLife 360 process, track observer progress, send reminders, and access your report."
    : isCommandCenterAccess
      ? "Use the owner account to review assessment activity, create groups, and manage the people connected to classes, circles, and future dashboards."
      : "Sign in to continue the DYDD Journey, collect your artifacts, and prepare for guided reflection around your design.";
  const signInHref = `/login?${new URLSearchParams({ mode: "signin", next }).toString()}`;
  const signUpHref = `/login?${new URLSearchParams({ mode: "signup", next }).toString()}`;
  const recoveryHref = `/login?${new URLSearchParams({ mode: "recovery", next }).toString()}`;

  return (
    <main className={`login-shell${isMiniAppAccess ? " fruitlife-access-shell" : ""}`}>
      <section className="login-copy">
        {isMiniAppAccess ? (
          <>
            <img
              className="fruitlife-login-logo"
              src={isSpiritualGiftsAccess ? "/brand/tools/spiritual-gifts-logo.jpg" : "/brand/tools/fruitful-life-360-logo.jpg"}
              alt={isSpiritualGiftsAccess ? "Spiritual Gifts" : "FruitLife 360"}
            />
            <p className="eyebrow">{accessTitle}</p>
            <h1>{accessHeading}</h1>
            <p className="lede">{accessCopy}</p>
          </>
        ) : (
          <>
            <Link className="text-link" href="/">
              Discover Your Divine Design
            </Link>
            <p className="eyebrow">{accessTitle}</p>
            <h1>{accessHeading}</h1>
            <p className="lede">{accessCopy}</p>
          </>
        )}
      </section>

      <section className="login-panel" aria-label="Account access">
        <div>
          <p className="section-label">Account</p>
          <h2>
            {mode === "signup"
              ? "Create account"
              : mode === "recovery"
                ? "Reset password"
                : "Sign in"}
          </h2>
          <p className="helper-text">
            {mode === "signup"
              ? "Create your account once, then return anytime with your email and password."
              : mode === "recovery"
                ? "Enter your account email and we will send a reset link."
                : isCommandCenterAccess
                  ? "Use the owner email and password. If the password is not clear, use Forgot password from this page."
                  : "Use your email and password to continue."}
          </p>
        </div>

        <div className="login-choice" role="tablist" aria-label="Account action">
          <Link
            aria-selected={mode === "signin"}
            className={mode === "signin" ? "active" : ""}
            href={signInHref}
          >
            Sign in
          </Link>
          <Link
            aria-selected={mode === "signup"}
            className={mode === "signup" ? "active" : ""}
            href={signUpHref}
          >
            Create account
          </Link>
        </div>

        {mode === "signup" ? (
          <form action={createPasswordAccount} className="auth-form">
            <input name="next" type="hidden" value={next} />
            <label htmlFor="full-name">Name</label>
            <input
              autoComplete="name"
              id="full-name"
              name="full_name"
              placeholder="Your name"
              required
              type="text"
            />
            <label htmlFor="signup-email">Email address</label>
            <input
              autoComplete="email"
              id="signup-email"
              name="email"
              placeholder="you@example.com"
              required
              type="email"
            />
            <label htmlFor="signup-password">Password</label>
            <input
              autoComplete="new-password"
              id="signup-password"
              minLength={8}
              name="password"
              required
              type="password"
            />
            <label htmlFor="confirm-password">Confirm password</label>
            <input
              autoComplete="new-password"
              id="confirm-password"
              minLength={8}
              name="confirm_password"
              required
              type="password"
            />
            <button className="button primary" type="submit">
              Create account
            </button>
          </form>
        ) : mode === "recovery" ? (
          <form action={requestPasswordReset} className="auth-form">
            <input name="next" type="hidden" value={next} />
            <label htmlFor="recovery-email">Email address</label>
            <input
              autoComplete="email"
              id="recovery-email"
              name="email"
              placeholder="you@example.com"
              required
              type="email"
            />
            <button className="button primary" type="submit">
              Send reset link
            </button>
          </form>
        ) : (
          <form action={signInWithPassword} className="auth-form">
            <input name="next" type="hidden" value={next} />
            <label htmlFor="email">Email address</label>
            <input
              autoComplete="email"
              id="email"
              name="email"
              placeholder="you@example.com"
              required
              type="email"
            />
            <label htmlFor="password">Password</label>
            <input
              autoComplete="current-password"
              id="password"
              name="password"
              required
              type="password"
            />
            <button className="button primary" type="submit">
              Sign in
            </button>
          </form>
        )}

        {mode !== "recovery" ? (
          <Link className="login-recovery-toggle" href={recoveryHref}>
            Forgot password?
          </Link>
        ) : (
          <Link className="login-recovery-toggle" href={signInHref}>
            Return to sign in
          </Link>
        )}

        {message ? <p className="status-note">{message}</p> : null}

        {isMiniAppAccess ? (
          <p className="helper-text">
            Your account keeps this assessment connected to you so
            your reports and courses are ready when you return.
          </p>
        ) : null}
      </section>
    </main>
  );
}
