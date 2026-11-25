import type { Metadata } from "next";
import { allCourseSummaries } from "@/lib/courses/course-catalog";
import { AppChrome } from "@/components/app-chrome";
import "./globals.css";
import "./field-guide.css";
import "./forest.css";
import "./game.css";
import "./environments.css";
import "./destination-rooms.css";
import "./course-walkthrough.css";

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
  // Project public metadata on the server; never bundle gated lesson bodies with the book.
  const courseBook=allCourseSummaries.map(({slug,title,description,hrefBase,logo})=>({slug,title,description,hrefBase,logo}));
  return (
    <html lang="en">
      <body>
        <AppChrome courses={courseBook}>{children}</AppChrome>
      </body>
    </html>
  );
}
