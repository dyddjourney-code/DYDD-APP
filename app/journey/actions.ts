"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { dyddJourney } from "@/lib/journey/dydd-journey";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type WorkbookResponseRecord = {
  dydi_context: {
    care_step: string | null;
    stage_title: string;
  };
  journey_slug: string;
  prompt_id: string;
  response_json: {
    items?: string[];
  };
  response_text: string;
  response_type: string;
  stage_slug: string;
  user_id: string;
};

function getStage(stageSlug: string) {
  return dyddJourney.stages.find((stage) => stage.slug === stageSlug);
}

function getStagePrompts(stage: NonNullable<ReturnType<typeof getStage>>) {
  return [
    ...stage.prompts,
    ...stage.sections.flatMap((section) => section.prompts),
    ...(stage.pathfinder?.prompts ?? []),
  ];
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

  const responses: WorkbookResponseRecord[] = [];

  for (const prompt of getStagePrompts(stage)) {
    const responseText = String(formData.get(prompt.id) ?? "").trim();

    if (!responseText) {
      continue;
    }

    responses.push({
      dydi_context: {
        care_step: prompt.careStep ?? null,
        stage_title: stage.title,
      },
      journey_slug: dyddJourney.slug,
      prompt_id: prompt.id,
      response_json:
        prompt.responseType === "list"
          ? {
              items: responseText
                .split(/\r?\n/)
                .map((item) => item.trim())
                .filter(Boolean),
            }
          : {},
      response_text: responseText,
      response_type: prompt.responseType,
      stage_slug: stage.slug,
      user_id: user.id,
    });
  }

  if (responses.length) {
    const { error } = await supabase.from("journey_workbook_responses").upsert(
      responses,
      { onConflict: "user_id,journey_slug,stage_slug,prompt_id" },
    );

    if (error) {
      redirect(`/journey?message=${encodeURIComponent(error.message)}`);
    }
  }

  revalidatePath("/journey");
  redirect(`/journey?saved=${encodeURIComponent(stage.slug)}#${stage.slug}`);
}
