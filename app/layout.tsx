import type { Metadata } from "next";
import { AppChrome } from "@/components/app-chrome";
import "./globals.css";
import "./field-guide.css";
import "./forest.css";
import "./game.css";
import "./environments.css";
import "./destination-rooms.css";

export const metadata: Metadata = {
  title: "DYDD — Sandbox 2",
  robots: { index: false, follow: false },
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
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
