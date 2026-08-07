"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function loginRedirect(message: string) {
  redirect(`/login?message=${encodeURIComponent(message)}`);
}

export async function signInWithMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email || !email.includes("@")) {
    loginRedirect("Enter a valid email address.");
  }

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? "http://localhost:3000";
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/hq`,
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
