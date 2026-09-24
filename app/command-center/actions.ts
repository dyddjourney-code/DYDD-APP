"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isDyddAdminEmail } from "@/lib/admin-access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/command-center")}`);
  }

  return user;
}

async function assertGroupAccess(groupId: string, userId: string, isAdmin: boolean) {
  const supabase = createSupabaseAdminClient();
  const { data: group } = await supabase
    .from("assessment_groups")
    .select("id,owner_user_id")
    .eq("id", groupId)
    .maybeSingle();

  if (!group || (!isAdmin && group.owner_user_id !== userId)) {
    throw new Error("You do not have access to that assessment group.");
  }
}

export async function createAssessmentGroup(formData: FormData) {
  const user = await getCurrentUser();
  const supabase = createSupabaseAdminClient();
  const name = getString(formData, "name");
  const groupType = getString(formData, "group_type") || "class_cohort";
  const description = getString(formData, "description") || null;

  if (!name) {
    redirect("/command-center?message=Name the group before creating it.");
  }

  const { data: group, error } = await supabase
    .from("assessment_groups")
    .insert({
      description,
      group_type: groupType,
      name,
      owner_user_id: user.id,
      status: "active",
    })
    .select("id")
    .single();

  if (error || !group?.id) {
    redirect(`/command-center?message=${encodeURIComponent(error?.message ?? "Unable to create group.")}`);
  }

  revalidatePath("/command-center");
  redirect(`/command-center?group=${encodeURIComponent(group.id)}&message=${encodeURIComponent("Group created.")}`);
}

export async function assignParticipantToAssessmentGroup(formData: FormData) {
  const user = await getCurrentUser();
  const groupId = getString(formData, "group_id");
  const participantId = getString(formData, "participant_id");
  const isAdmin = isDyddAdminEmail(user.email);

  if (!groupId || !participantId) {
    redirect("/command-center?message=Choose a group and a participant first.");
  }

  try {
    await assertGroupAccess(groupId, user.id, isAdmin);
  } catch (error) {
    redirect(
      `/command-center?message=${encodeURIComponent(
        error instanceof Error ? error.message : "Unable to assign participant.",
      )}`,
    );
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("assessment_group_members").upsert(
    {
      added_by_user_id: user.id,
      group_id: groupId,
      membership_status: "active",
      participant_id: participantId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "group_id,participant_id" },
  );

  revalidatePath("/command-center");
  const target = `/command-center?group=${encodeURIComponent(groupId)}`;

  if (error) {
    redirect(`${target}&message=${encodeURIComponent(error.message)}`);
  }

  redirect(`${target}&message=${encodeURIComponent("Participant assigned to group.")}`);
}

export async function archiveAssessmentGroupMember(formData: FormData) {
  const user = await getCurrentUser();
  const groupId = getString(formData, "group_id");
  const membershipId = getString(formData, "membership_id");
  const isAdmin = isDyddAdminEmail(user.email);

  if (!groupId || !membershipId) {
    redirect("/command-center?message=Missing group member.");
  }

  try {
    await assertGroupAccess(groupId, user.id, isAdmin);
  } catch (error) {
    redirect(
      `/command-center?message=${encodeURIComponent(
        error instanceof Error ? error.message : "Unable to update group member.",
      )}`,
    );
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("assessment_group_members")
    .update({
      membership_status: "archived",
      updated_at: new Date().toISOString(),
    })
    .eq("id", membershipId);

  revalidatePath("/command-center");
  const target = `/command-center?group=${encodeURIComponent(groupId)}`;

  if (error) {
    redirect(`${target}&message=${encodeURIComponent(error.message)}`);
  }

  redirect(`${target}&message=${encodeURIComponent("Participant removed from active group view.")}`);
}
