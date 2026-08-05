import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}

