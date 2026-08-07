"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const productionAppUrl = "https://dydd-online-school.vercel.app";

function loginRedirect(message: string) {
  redirect(`/login?message=${encodeURIComponent(message)}`);
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
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email || !email.includes("@")) {
    loginRedirect("Enter a valid email address.");
  }

  const requestHeaders = await headers();
  const appBaseUrl = getAppBaseUrl(requestHeaders);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${appBaseUrl}/auth/callback?next=/hq`,
    },
  });

  if (error) {
    loginRedirect(error.message);
  }

  loginRedirect("Check your email for the DYDD HQ sign-in link.");
}

export async function verifyEmailCode(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const token = String(formData.get("token") ?? "")
    .replace(/\D/g, "")
    .trim();

  if (!email || !email.includes("@")) {
    loginRedirect("Enter the same email address that received the code.");
  }

  if (token.length !== 6) {
    loginRedirect("Enter the 6-digit code from the email.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    loginRedirect(error.message);
  }

  redirect("/hq");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
