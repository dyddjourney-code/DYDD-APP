"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { dyddJourney } from "@/lib/journey/dydd-journey";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type WorkbookResponseRecord = {
  care_step: string | null;
  class_week: string;
  dydi_context: {
    assessment_callouts: string[];
    care_step: string | null;
    class_week: string;
    prompt_label: string;
    section_purpose: string | null;
    source_area: string;
    source_ref: string | null;
    stage_slug: string;
    stage_title: string;
  };
  entry_version: number;
  is_current: boolean;
  journey_slug: string;
  prompt_id: string;
  prompt_label: string;
  response_json: {
    items?: string[];
  };
  response_text: string;
  response_type: string;
  section_slug: string | null;
  section_title: string | null;
  source_area: string;
  source_ref: string | null;
  stage_slug: string;
  stage_order: number;
  stage_title: string;
  subject_label: string;
  subject_slug: string;
  supersedes_response_id?: string;
  user_id: string;
};

type PromptContext = {
  careStep: string | null;
  helper?: string;
  id: string;
  label: string;
  responseType: "short_text" | "long_text" | "list" | "declaration";
  sectionPurpose: string | null;
  sectionSlug: string | null;
  sectionTitle: string | null;
  sourceArea: "journey_prompt" | "care_prompt" | "pathfinder";
  sourceRef: string | null;
  subjectLabel: string;
  subjectSlug: string;
};

function getStage(stageSlug: string) {
  return dyddJourney.stages.find((stage) => stage.slug === stageSlug);
}

function getStagePromptContexts(
  stage: NonNullable<ReturnType<typeof getStage>>,
): PromptContext[] {
  return [
    ...stage.prompts.map((prompt) => ({
      ...prompt,
      careStep: prompt.careStep ?? null,
      sectionPurpose: null,
      sectionSlug: null,
      sectionTitle: null,
      sourceArea: "journey_prompt" as const,
      sourceRef: stage.sourcePages,
      subjectLabel: stage.title,
      subjectSlug: stage.slug,
    })),
    ...stage.sections.flatMap((section) =>
      section.prompts.map((prompt) => ({
        ...prompt,
        careStep: prompt.careStep ?? null,
        sectionPurpose: section.purpose,
        sectionSlug: section.slug,
        sectionTitle: section.title,
        sourceArea: "care_prompt" as const,
        sourceRef: section.sourceRef,
        subjectLabel: section.title,
        subjectSlug: section.slug,
      })),
    ),
    ...(stage.pathfinder?.prompts.map((prompt) => ({
      ...prompt,
      careStep: prompt.careStep ?? null,
      sectionPurpose: stage.pathfinder?.body ?? null,
      sectionSlug: "pathfinder",
      sectionTitle: stage.pathfinder?.title ?? null,
      sourceArea: "pathfinder" as const,
      sourceRef: stage.sourcePages,
      subjectLabel: "Pathfinder",
      subjectSlug: "pathfinder",
    })) ?? []),
  ];
}

function responseJsonFor(responseType: string, responseText: string) {
  if (responseType !== "list") {
    return {};
  }

  return {
    items: responseText
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean),
  };
}

export async function saveJourneyStageResponses(formData: FormData) {
  const stageSlug = String(formData.get("stage_slug") ?? "");
  const stage = getStage(stageSlug);

  if (!stage) {
    redirect("/journey?message=Unknown journey stage.");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Sign in to save your DYDD workbook responses.");
  }

  await supabase.from("journey_enrollments").upsert(
    {
      current_stage_slug: stage.slug,
      journey_slug: dyddJourney.slug,
      status: "active",
      user_id: user.id,
    },
    { onConflict: "user_id,journey_slug" },
  );

  const promptContexts = getStagePromptContexts(stage);
  const promptIds = promptContexts.map((prompt) => prompt.id);
  const { data: currentRows, error: currentRowsError } = await supabase
    .from("journey_workbook_responses")
    .select("id,prompt_id,entry_version")
    .eq("user_id", user.id)
    .eq("journey_slug", dyddJourney.slug)
    .eq("stage_slug", stage.slug)
    .eq("is_current", true)
    .in("prompt_id", promptIds);

  if (currentRowsError) {
    redirect(`/journey?message=${encodeURIComponent(currentRowsError.message)}`);
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
  const responses: WorkbookResponseRecord[] = [];
  const stageOrder = dyddJourney.stages.findIndex((item) => item.slug === stage.slug) + 1;
  const assessmentCallouts =
    stage.assessmentCallouts?.map((callout) => callout.assessment) ?? [];

  for (const prompt of promptContexts) {
    const responseText = String(formData.get(prompt.id) ?? "").trim();

    if (!responseText) {
      continue;
    }

    const current = currentByPrompt.get(prompt.id);

    responses.push({
      care_step: prompt.careStep,
      class_week: stage.classWeek,
      dydi_context: {
        assessment_callouts: assessmentCallouts,
        care_step: prompt.careStep,
        class_week: stage.classWeek,
        prompt_label: prompt.label,
        section_purpose: prompt.sectionPurpose,
        source_area: prompt.sourceArea,
        source_ref: prompt.sourceRef,
        stage_slug: stage.slug,
        stage_title: stage.title,
      },
      entry_version: current ? current.version + 1 : 1,
      is_current: true,
      journey_slug: dyddJourney.slug,
      prompt_id: prompt.id,
      prompt_label: prompt.label,
      response_json: responseJsonFor(prompt.responseType, responseText),
      response_text: responseText,
      response_type: prompt.responseType,
      section_slug: prompt.sectionSlug,
      section_title: prompt.sectionTitle,
      source_area: prompt.sourceArea,
      source_ref: prompt.sourceRef,
      stage_slug: stage.slug,
      stage_order: stageOrder,
      stage_title: stage.title,
      subject_label: prompt.subjectLabel,
      subject_slug: prompt.subjectSlug,
      ...(current ? { supersedes_response_id: current.id } : {}),
      user_id: user.id,
    });
  }

  if (responses.length) {
    const currentIds = responses
      .map((response) => response.supersedes_response_id)
      .filter((id): id is string => Boolean(id));

    if (currentIds.length) {
      const { error } = await supabase
        .from("journey_workbook_responses")
        .update({ is_current: false })
        .in("id", currentIds);

      if (error) {
        redirect(`/journey?message=${encodeURIComponent(error.message)}`);
      }
    }

    const { error } = await supabase.from("journey_workbook_responses").insert(responses);

    if (error) {
      redirect(`/journey?message=${encodeURIComponent(error.message)}`);
    }
  }

  revalidatePath("/journey");
  redirect(`/journey?saved=${encodeURIComponent(stage.slug)}#${stage.slug}`);
}
