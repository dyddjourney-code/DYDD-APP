import type { Metadata } from "next";
import Link from "next/link";
import { AppMobileNav } from "@/components/app-mobile-nav";
import { AppSidebar } from "@/components/app-sidebar";
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
        <AppMobileNav />
        <div className="app-frame">
          <AppSidebar />
          <div className="app-frame-content">
            {children}
            <footer className="app-footer" aria-label="App support links">
              <span>Contact</span>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
