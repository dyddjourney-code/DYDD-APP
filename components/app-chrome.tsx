"use client";

import Link from "next/link";
import { Suspense } from "react";
import { ForestNavigation } from "@/components/forest-navigation";

type AppChromeProps = { children: React.ReactNode };

export function AppChrome({ children }: AppChromeProps) {
  return <>
    <Suspense fallback={<div className="forest-header forest-nav-loading" aria-label="Loading navigation" />}><ForestNavigation /></Suspense>
    <div className="app-frame"><div className="app-frame-content" id="forest-content" tabIndex={-1}>
      {children}
      <footer className="app-footer" aria-label="App support links"><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></footer>
    </div></div>
  </>;
}
