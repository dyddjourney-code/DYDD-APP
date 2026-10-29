"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AppMobileNav } from "@/components/app-mobile-nav";
import { AppSidebar } from "@/components/app-sidebar";

type AppChromeProps = {
  children: React.ReactNode;
};

function AppChromeFrame({ children }: AppChromeProps) {
  const searchParams = useSearchParams();
  const fruitLifeLane = searchParams.get("lane") === "fruitlife";

  if (fruitLifeLane) {
    return <>{children}</>;
  }

  return (
    <>
      <Suspense fallback={null}>
        <AppMobileNav />
      </Suspense>
      <div className="app-frame">
        <Suspense fallback={null}>
          <AppSidebar />
        </Suspense>
        <div className="app-frame-content">
          {children}
          <footer className="app-footer" aria-label="App support links">
            <Link href="/contact">Contact</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            {process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT !== "sandbox" ? <a href="https://dydd-private-owner-console.vercel.app/command-center" referrerPolicy="no-referrer">Owner sign-in</a> : null}
          </footer>
        </div>
      </div>
    </>
  );
}

export function AppChrome({ children }: AppChromeProps) {
  return (
    <Suspense fallback={children}>
      <AppChromeFrame>{children}</AppChromeFrame>
    </Suspense>
  );
}
