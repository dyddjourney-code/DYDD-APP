"use server";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateDesignPdForUser } from "@/lib/designpd/service";
export async function saveDesignPdResponse(formData: FormData) {
  const db = await createSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login?next=%2Fdesignpd");
  await generateDesignPdForUser(user, formData);
}
