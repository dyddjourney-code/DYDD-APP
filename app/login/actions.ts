"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const productionAppUrl = "https://dydd-online-school.vercel.app";

function safeNextPath(value: FormDataEntryValue | string | null | undefined) {
  const next = String(value ?? "").trim();

  if (!next.startsWith("/") || next.startsWith("//")) {
    return "/hq";
  }

  return next;
}

function loginRedirect(message: string, next = "/hq", mode?: "signin" | "signup" | "recovery"): never {
  const params = new URLSearchParams({
    message,
    next,
  });
  if (mode) {
    params.set("mode", mode);
  }
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

  loginRedirect(
    next.includes("lane=fruitlife") || next.startsWith("/fruitlife360")
      ? "Check your email for your FruitLife 360 access link or code."
      : "Check your email for your DYDD access link or code.",
    next,
  );
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

async function upsertSchoolProfile(userId: string, email: string, fullName?: string | null) {
  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const normalizedEmail = email.trim().toLowerCase();
    const cleanedName = fullName?.trim() || null;

    await supabaseAdmin.from("school_profiles").upsert(
      {
        email: normalizedEmail,
        full_name: cleanedName,
        id: userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
  } catch (profileError) {
    console.error("Unable to sync school profile during account auth", profileError);
  }
}

export async function createPasswordAccount(formData: FormData) {
  const next = safeNextPath(formData.get("next"));
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!fullName) {
    loginRedirect("Enter your name.", next, "signup");
  }

  if (!email || !email.includes("@")) {
    loginRedirect("Enter a valid email address.", next, "signup");
  }

  if (password.length < 8) {
    loginRedirect("Use a password with at least 8 characters.", next, "signup");
  }

  if (password !== confirmPassword) {
    loginRedirect("The passwords do not match.", next, "signup");
  }

  const requestHeaders = await headers();
  const appBaseUrl = getAppBaseUrl(requestHeaders);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${appBaseUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    loginRedirect(error.message, next, "signup");
  }

  if (data.user && data.session) {
    await upsertSchoolProfile(data.user.id, email, fullName);
    redirect(next);
  }

  loginRedirect(
    "Check your email to confirm your account. After confirming, you can sign in with your email and password.",
    next,
    "signin",
  );
}

export async function signInWithPassword(formData: FormData) {
  const next = safeNextPath(formData.get("next"));
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !email.includes("@")) {
    loginRedirect("Enter your account email.", next, "signin");
  }

  if (!password) {
    loginRedirect("Enter your password.", next, "signin");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    loginRedirect(error.message, next, "signin");
  }

  if (data.user) {
    const fullName =
      typeof data.user.user_metadata?.full_name === "string"
        ? data.user.user_metadata.full_name
        : null;
    await upsertSchoolProfile(data.user.id, email, fullName);
  }

  redirect(next);
}

export async function requestPasswordReset(formData: FormData) {
  const next = safeNextPath(formData.get("next"));
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    loginRedirect("Enter the email address on your account.", next, "recovery");
  }

  const requestHeaders = await headers();
  const appBaseUrl = getAppBaseUrl(requestHeaders);
  const resetNext = `/reset-password?next=${encodeURIComponent(next)}`;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appBaseUrl}/auth/callback?next=${encodeURIComponent(resetNext)}`,
  });

  if (error) {
    loginRedirect(error.message, next, "recovery");
  }

  loginRedirect("If that email has an account, a password reset link is on the way.", next, "signin");
}

export async function updatePassword(formData: FormData) {
  const next = safeNextPath(formData.get("next"));
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (password.length < 8) {
    redirect(
      `/reset-password?${new URLSearchParams({
        message: "Use a password with at least 8 characters.",
        next,
      }).toString()}`,
    );
  }

  if (password !== confirmPassword) {
    redirect(
      `/reset-password?${new URLSearchParams({
        message: "The passwords do not match.",
        next,
      }).toString()}`,
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(
      `/reset-password?${new URLSearchParams({
        message: error.message,
        next,
      }).toString()}`,
    );
  }

  loginRedirect("Password updated. Sign in with your new password.", next, "signin");
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
