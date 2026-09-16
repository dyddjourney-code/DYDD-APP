import Link from "next/link";
import { signInWithMagicLink, verifyEmailCode } from "./actions";

type LoginPageProps = {
  searchParams?: Promise<{
    message?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const message = params?.message;
  const next = params?.next?.startsWith("/") ? params.next : "/hq";
  const isFruitLifeAccess = next.includes("lane=fruitlife") || next.startsWith("/fruitlife360");
  const accessTitle = isFruitLifeAccess ? "FruitLife 360 access" : "DYDD Base Camp access";
  const accessHeading = isFruitLifeAccess ? "Enter Base Camp." : "Enter Base Camp.";
  const accessCopy = isFruitLifeAccess
    ? "Use your email to open the FruitLife 360 process, set up your assessment, track observer progress, and return while responses come in."
    : "Sign in to continue the DYDD Journey, collect your artifacts, and prepare for companion-guided reflection around your design.";
  const emailHelper = isFruitLifeAccess
    ? "We will send a secure access email to this address. Use the same email when you return to your FruitLife 360 process."
    : "We will send a secure access email to this address. Use the same email when you return to Base Camp.";
  const codeHelper = isFruitLifeAccess
    ? "Enter the code from your email, then continue into your FruitLife 360 Base Camp."
    : "Enter the code from your email, then continue into Base Camp.";

  return (
    <main className={`login-shell${isFruitLifeAccess ? " fruitlife-access-shell" : ""}`}>
      <section className="login-copy">
        {isFruitLifeAccess ? (
          <>
            <img
              className="fruitlife-login-logo"
              src="/brand/tools/fruitful-life-360-logo.jpg"
              alt="FruitLife 360"
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

      <section className="login-panel" aria-label="Request sign-in link">
        <div>
          <p className="section-label">Step one</p>
          <h2>Enter your email.</h2>
        </div>
        <form action={signInWithMagicLink} className="auth-form">
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
          <p className="helper-text">{emailHelper}</p>
          <button className="button primary" type="submit">
            Send access email
          </button>
        </form>
        {message ? <p className="status-note">{message}</p> : null}
      </section>

      <section className="login-panel code-panel" aria-label="Enter email code">
        <div>
          <p className="section-label">Step two</p>
          <h2>Check your email.</h2>
        </div>
        <form action={verifyEmailCode} className="auth-form">
          <input name="next" type="hidden" value={next} />
          <label htmlFor="code-email">Email address</label>
          <input
            autoComplete="email"
            id="code-email"
            name="email"
            placeholder="you@example.com"
            required
            type="email"
          />
          <label htmlFor="token">Code from email</label>
          <input
            autoComplete="one-time-code"
            id="token"
            inputMode="numeric"
            maxLength={6}
            name="token"
            pattern="[0-9]{6}"
            placeholder="6-digit code"
            required
            type="text"
          />
          <p className="helper-text">{codeHelper}</p>
          <button className="button primary" type="submit">
            Enter Base Camp
          </button>
        </form>
      </section>
    </main>
  );
}
