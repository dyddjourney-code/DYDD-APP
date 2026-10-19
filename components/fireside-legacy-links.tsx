"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Keep previously shared section links working after the page split.
export function FiresideLegacyLinks() {
  const router = useRouter();
  useEffect(() => {
    const followLegacyLink = () => {
      const destination = window.location.hash === "#waypoints" ? "/waypoints" : window.location.hash === "#live" ? "/live" : null;
      if (destination) router.replace(`${destination}${window.location.search}`);
    };
    followLegacyLink();
    window.addEventListener("hashchange", followLegacyLink);
    return () => window.removeEventListener("hashchange", followLegacyLink);
  }, [router]);
  return null;
}
