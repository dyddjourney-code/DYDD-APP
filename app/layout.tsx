import type { Metadata } from "next";
import { AppChrome } from "@/components/app-chrome";
import "./globals.css";

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
            DYDD Sandbox — separate test accounts and data. Email, payments and external report delivery are off.
          </div>
        ) : null}
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
