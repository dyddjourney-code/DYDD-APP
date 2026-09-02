"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type FruitLifeSessionAutoRefreshProps = {
  enabled: boolean;
};

export function FruitLifeSessionAutoRefresh({
  enabled,
}: FruitLifeSessionAutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const interval = window.setInterval(() => {
      router.refresh();
    }, 8000);

    return () => window.clearInterval(interval);
  }, [enabled, router]);

  return null;
}
