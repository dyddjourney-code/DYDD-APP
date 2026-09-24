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
            <span>Contact</span>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
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
