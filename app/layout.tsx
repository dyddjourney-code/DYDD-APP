import { isPrivateOwnerConsole } from "@/lib/private-owner";
import Link from "next/link";
import type { Metadata } from "next";
import { AppChrome } from "@/components/app-chrome";
import "./globals.css";
import "./field-guide.css";

export const metadata: Metadata = {
  title: "DYDD Online School",
  description:
    "A course and companion platform for Discover Your Divine Design.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT === "sandbox" ? (
          <div role="note" style={{ padding: "10px 20px", background: "#f0d99e", color: "#3f381d", fontSize: 14, textAlign: "center" }}>
            DYDD Sandbox — separate test accounts and data. Email, payments and external report delivery are off.{" "}
            <a href="/base-camp" style={{ color: "inherit", textDecoration: "underline", whiteSpace: "nowrap" }}>Sandbox Base Camp</a>
            {" · "}<a href="/sandbox-review" style={{ color: "inherit", textDecoration: "underline", whiteSpace: "nowrap" }}>Preview all courses</a>
          </div>
        ) : null}
        {isPrivateOwnerConsole() ? <>
          <header style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 20, padding: "16px 24px", background: "#fffaf0", borderBottom: "1px solid #d5decc" }}>
            <Link href="/command-center"><img src="/brand/dydd-logo.webp" alt="Discover Your Divine Design" style={{ width: 160 }} /></Link>
            <nav aria-label="Owner Command Center" style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
              <Link href="/command-center">Command Center</Link><Link href="/command-center/accounts">Accounts</Link><Link href="/command-center/design-map">Design Map</Link><Link href="/command-center/maps">MAPS</Link><Link href="/command-center/expedition">Expedition</Link>
            </nav>
            <nav aria-label="Return to DYDD app" style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              <a href="https://dydd-online-school.vercel.app/base-camp" referrerPolicy="no-referrer">Live Base Camp</a>
              <a href="https://dydd-online-school-sandbox.vercel.app/base-camp" referrerPolicy="no-referrer">Sandbox Base Camp</a>
            </nav>
            <small>Private owner · Original-school live data. App sign-ins are separate.</small>
          </header>
          {children}
        </> : <AppChrome>{children}</AppChrome>}
      </body>
    </html>
  );
}
