import type { Metadata } from "next";
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
          <div className="app-frame-content">{children}</div>
        </div>
      </body>
    </html>
  );
}
