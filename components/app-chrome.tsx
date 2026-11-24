"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ForestNavigation } from "@/components/forest-navigation";

type AppChromeProps = { children: React.ReactNode };

function AppChromeFrame({ children }: AppChromeProps) {
  const searchParams = useSearchParams();
  // Preserve the dedicated mini-app navigation and lane boundary.
  if (searchParams.get("lane") === "fruitlife") return <>{children}</>;
  return <>
    <Suspense fallback={<div className="forest-header forest-nav-loading" aria-label="Loading navigation" />}><ForestNavigation /></Suspense>
    <div className="app-frame"><div className="app-frame-content" id="forest-content" tabIndex={-1}>
      {children}
      <footer className="app-footer" aria-label="App support links"><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></footer>
    </div></div>
  </>;
}

export function AppChrome({ children }: AppChromeProps) {
  return <Suspense fallback={children}><AppChromeFrame>{children}</AppChromeFrame></Suspense>;
}
