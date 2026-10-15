"use client";
import { useEffect } from "react";
export function ClearSubmittedFruitLifeDraft({ session, token, type }: { session: string; token: string; type: string }) {
  useEffect(() => { try { localStorage.removeItem(`fruitlife360:v1:${session}:${type}:${token}`); } catch {} }, [session, token, type]);
  return null;
}
