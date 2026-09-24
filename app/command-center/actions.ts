"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDyddAdminEmails, isDyddAdminEmail } from "@/lib/admin-access";
import { canonicalizeParticipantEmail } from "@/lib/identity/email";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function isOwnerPreviewForm(formData: FormData) {
  const review = getString(formData, "review");
  const key = getString(formData, "key");

  return (
    review === "owner" &&
    Boolean(key) &&
    Boolean(process.env.DYDD_REVIEW_TOKEN) &&
    key === process.env.DYDD_REVIEW_TOKEN
  );
}

function commandCenterTarget(
  formData: FormData,
  values: Record<string, string | null | undefined> = {},
) {
  const query = new URLSearchParams();

  if (isOwnerPreviewForm(formData)) {
    query.set("review", "owner");
    query.set("key", getString(formData, "key"));
  }

  for (const [key, value] of Object.entries(values)) {
    if (value) query.set(key, value);
  }

  const queryString = query.toString();
  return queryString ? `/command-center?${queryString}` : "/command-center";
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

async function getCommandCenterActor(formData: FormData) {
  if (!isOwnerPreviewForm(formData)) {
    const user = await getCurrentUser();
    return {
      email: user.email ?? "",
      id: user.id,
      isAdmin: isDyddAdminEmail(user.email),
    };
  }

  const supabase = createSupabaseAdminClient();
  const adminEmails = getDyddAdminEmails();
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  const owner = data?.users.find((user) =>
    adminEmails.has(canonicalizeParticipantEmail(user.email)),
  );

  if (error || !owner) {
    redirect(
      commandCenterTarget(formData, {
        message: error?.message ?? "Owner account was not found for this private command center action.",
      }),
    );
  }

  return {
    email: owner.email ?? "owner-preview",
    id: owner.id,
    isAdmin: true,
  };
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
  const actor = await getCommandCenterActor(formData);
  const supabase = createSupabaseAdminClient();
  const name = getString(formData, "name");
  const groupType = getString(formData, "group_type") || "class_cohort";
  const description = getString(formData, "description") || null;

  if (!name) {
    redirect(commandCenterTarget(formData, { message: "Name the group before creating it." }));
  }

  const { data: group, error } = await supabase
    .from("assessment_groups")
    .insert({
      description,
      group_type: groupType,
      name,
      owner_user_id: actor.id,
      status: "active",
    })
    .select("id")
    .single();

  if (error || !group?.id) {
    redirect(commandCenterTarget(formData, { message: error?.message ?? "Unable to create group." }));
  }

  revalidatePath("/command-center");
  redirect(commandCenterTarget(formData, { group: group.id, message: "Group created." }));
}

export async function assignParticipantToAssessmentGroup(formData: FormData) {
  const actor = await getCommandCenterActor(formData);
  const groupId = getString(formData, "group_id");
  const participantId = getString(formData, "participant_id");

  if (!groupId || !participantId) {
    redirect(commandCenterTarget(formData, { message: "Choose a group and a participant first." }));
  }

  try {
    await assertGroupAccess(groupId, actor.id, actor.isAdmin);
  } catch (error) {
    redirect(
      commandCenterTarget(formData, {
        message: error instanceof Error ? error.message : "Unable to assign participant.",
      }),
    );
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("assessment_group_members").upsert(
    {
      added_by_user_id: actor.id,
      group_id: groupId,
      membership_status: "active",
      participant_id: participantId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "group_id,participant_id" },
  );

  revalidatePath("/command-center");
  const target = commandCenterTarget(formData, { group: groupId });

  if (error) {
    redirect(`${target}&message=${encodeURIComponent(error.message)}`);
  }

  redirect(`${target}&message=${encodeURIComponent("Participant assigned to group.")}`);
}

export async function archiveAssessmentGroupMember(formData: FormData) {
  const actor = await getCommandCenterActor(formData);
  const groupId = getString(formData, "group_id");
  const membershipId = getString(formData, "membership_id");

  if (!groupId || !membershipId) {
    redirect(commandCenterTarget(formData, { message: "Missing group member." }));
  }

  try {
    await assertGroupAccess(groupId, actor.id, actor.isAdmin);
  } catch (error) {
    redirect(
      commandCenterTarget(formData, {
        message: error instanceof Error ? error.message : "Unable to update group member.",
      }),
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
  const target = commandCenterTarget(formData, { group: groupId });

  if (error) {
    redirect(`${target}&message=${encodeURIComponent(error.message)}`);
  }

  redirect(`${target}&message=${encodeURIComponent("Participant removed from active group view.")}`);
}
