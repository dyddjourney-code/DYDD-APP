"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const journalPrompts = [
  {
    id: "journal-designid-reflection",
    label: "Reflect on DesignID",
    subjectLabel: "DesignID",
    subjectSlug: "designid",
  },
  {
    id: "journal-spiritual-gifts-reflection",
    label: "Reflect on Spiritual Gifts",
    subjectLabel: "Spiritual Gifts",
    subjectSlug: "spiritual-gifts",
  },
  {
    id: "journal-next-faithful-step",
    label: "Next faithful step",
    subjectLabel: "Next Faithful Step",
    subjectSlug: "next-faithful-step",
  },
];

export async function saveGearJournalEntries(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Sign in to save journal entries.");
  }

  const filledPrompts = journalPrompts
    .map((prompt) => ({
      ...prompt,
      responseText: String(formData.get(prompt.id) ?? "").trim(),
    }))
    .filter((prompt) => prompt.responseText);

  if (!filledPrompts.length) {
    redirect("/gear?message=Add a journal note before saving.#journal");
  }

  const promptIds = filledPrompts.map((prompt) => prompt.id);
  const { data: currentRows, error: currentRowsError } = await supabase
    .from("journey_workbook_responses")
    .select("id,prompt_id,entry_version")
    .eq("user_id", user.id)
    .eq("journey_slug", "discover-your-divine-design")
    .eq("stage_slug", "gear")
    .eq("is_current", true)
    .in("prompt_id", promptIds);

  if (currentRowsError) {
    redirect(`/gear?message=${encodeURIComponent(currentRowsError.message)}#journal`);
  }

  const currentByPrompt = new Map(
    (currentRows ?? []).map((row) => [
      row.prompt_id as string,
      {
        id: row.id as string,
        version: Number(row.entry_version ?? 1),
      },
    ]),
  );

  const records = filledPrompts.map((prompt) => {
    const current = currentByPrompt.get(prompt.id);

    return {
      care_step: "reflect",
      class_week: "Gear",
      dydi_context: {
        care_step: "reflect",
        class_week: "Gear",
        prompt_label: prompt.label,
        section_purpose: "Journal entries can be reused by Journey, Pathfinder, and Dydi.",
        source_area: "journal",
        source_ref: "/gear#journal",
        stage_slug: "gear",
        stage_title: "Gear Journal",
      },
      entry_version: current ? current.version + 1 : 1,
      is_current: true,
      journey_slug: "discover-your-divine-design",
      prompt_id: prompt.id,
      prompt_label: prompt.label,
      response_json: {},
      response_text: prompt.responseText,
      response_type: "long_text",
      section_slug: "journal",
      section_title: "Journal",
      source_area: "journal",
      source_ref: "/gear#journal",
      stage_order: 0,
      stage_slug: "gear",
      stage_title: "Gear Journal",
      subject_label: prompt.subjectLabel,
      subject_slug: prompt.subjectSlug,
      ...(current ? { supersedes_response_id: current.id } : {}),
      user_id: user.id,
    };
  });

  const currentIds = records
    .map((record) => record.supersedes_response_id)
    .filter((id): id is string => Boolean(id));

  if (currentIds.length) {
    const { error } = await supabase
      .from("journey_workbook_responses")
      .update({ is_current: false })
      .in("id", currentIds);

    if (error) {
      redirect(`/gear?message=${encodeURIComponent(error.message)}#journal`);
    }
  }

  const { error } = await supabase.from("journey_workbook_responses").insert(records);

  if (error) {
    redirect(`/gear?message=${encodeURIComponent(error.message)}#journal`);
  }

  revalidatePath("/gear");
  redirect(`/gear?saved=${records.length}#journal`);
}
