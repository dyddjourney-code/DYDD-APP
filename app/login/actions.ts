"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const productionAppUrl = "https://dydd-online-school.vercel.app";

function safeNextPath(value: FormDataEntryValue | string | null | undefined) {
  const next = String(value ?? "").trim();

  if (!next.startsWith("/") || next.startsWith("//")) {
    return "/hq";
  }

  return next;
}

function loginRedirect(message: string, next = "/hq"): never {
  const params = new URLSearchParams({
    message,
    next,
  });
  redirect(`/login?${params.toString()}`);
}

function getAppBaseUrl(requestHeaders: Headers) {
  const configuredUrl =
    process.env.DYDD_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;

  if (vercelUrl) {
    return `https://${vercelUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  }

  const origin = requestHeaders.get("origin");

  if (origin && !origin.includes("localhost") && !origin.includes("127.0.0.1")) {
    return origin.replace(/\/$/, "");
  }

  if (process.env.NODE_ENV === "production") {
    return productionAppUrl;
  }

  return origin?.replace(/\/$/, "") ?? "http://localhost:3000";
}

export async function signInWithMagicLink(formData: FormData) {
  const next = safeNextPath(formData.get("next"));
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email || !email.includes("@")) {
    loginRedirect("Enter a valid email address.", next);
  }

  const requestHeaders = await headers();
  const appBaseUrl = getAppBaseUrl(requestHeaders);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${appBaseUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    loginRedirect(error.message, next);
  }

  loginRedirect("Check your email for the DYDD sign-in link.", next);
}

export async function verifyEmailCode(formData: FormData) {
  const next = safeNextPath(formData.get("next"));
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const token = String(formData.get("token") ?? "")
    .replace(/\D/g, "")
    .trim();

  if (!email || !email.includes("@")) {
    loginRedirect("Enter the same email address that received the code.", next);
  }

  if (token.length !== 6) {
    loginRedirect("Enter the 6-digit code from the email.", next);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    loginRedirect(error.message, next);
  }

  redirect(next);
}

export async function enterHeatherPreview() {
  const reviewToken = process.env.DYDD_REVIEW_TOKEN;

  if (!reviewToken) {
    loginRedirect("Heather preview access is not configured yet.");
  }

  redirect(`/hq?review=heather&key=${encodeURIComponent(reviewToken)}`);
}

export async function enterNewPreview() {
  const reviewToken = process.env.DYDD_REVIEW_TOKEN;

  if (!reviewToken) {
    loginRedirect("New-person preview access is not configured yet.");
  }

  redirect(`/hq?review=new&key=${encodeURIComponent(reviewToken)}`);
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
