"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ComponentProps } from "react";

type ReviewAwareLinkProps = ComponentProps<typeof Link> & {
  href: string;
};

export function ReviewAwareLink({ href, ...props }: ReviewAwareLinkProps) {
  const searchParams = useSearchParams();
  const review = searchParams.get("review");
  const key = searchParams.get("key");

  if (!review || !key || href.startsWith("http") || href.startsWith("#")) {
    return <Link href={href} {...props} />;
  }

  const url = new URL(href, "https://dydd.local");
  url.searchParams.set("review", review);
  url.searchParams.set("key", key);

  return <Link href={`${url.pathname}${url.search}${url.hash}`} {...props} />;
}
