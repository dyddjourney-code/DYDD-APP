import {
  hasDesignIdData,
  type StudentDesignContext,
} from "@/lib/assessments/student-context";

const missingValue = "Connect your DesignID results in HQ";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function designValue(
  context: StudentDesignContext | null,
  key: keyof StudentDesignContext["designId"],
) {
  return context?.designId[key] || missingValue;
}

export function personalizeDesignIdHtml(
  html: string,
  context: StudentDesignContext | null,
) {
  const replacements: Record<string, string> = {
    "contact.designid__architect_band": designValue(context, "architectBand"),
    "contact.designid__architect_pts": designValue(context, "architectPts"),
    "contact.designid__artisan_band": designValue(context, "artisanBand"),
    "contact.designid__artisan_pts": designValue(context, "artisanPts"),
    "contact.designid__integrative_expression": designValue(
      context,
      "integrativeExpression",
    ),
    "contact.designid__integrative_reflection": designValue(
      context,
      "integrativeReflection",
    ),
    "contact.designid__last_assessment_date": designValue(
      context,
      "lastAssessmentDate",
    ),
    "contact.designid__primary": designValue(context, "primary"),
    "contact.designid__primary_reflection": designValue(
      context,
      "primaryReflection",
    ),
    "contact.designid__primary_scripture": designValue(
      context,
      "primaryScripture",
    ),
    "contact.designid__reflection_shadow": designValue(
      context,
      "reflectionShadow",
    ),
    "contact.designid__report_version": designValue(context, "reportVersion"),
    "contact.designid__run_count": designValue(context, "runCount"),
    "contact.designid__secondary": designValue(context, "secondary"),
    "contact.designid__secondary_scripture": designValue(
      context,
      "secondaryScripture",
    ),
    "contact.designid__shepherd_band": designValue(context, "shepherdBand"),
    "contact.designid__shepherd_pts": designValue(context, "shepherdPts"),
    "contact.designid__steward_band": designValue(context, "stewardBand"),
    "contact.designid__steward_pts": designValue(context, "stewardPts"),
  };

  return html.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, rawToken: string) => {
    const token = rawToken.trim();
    return escapeHtml(replacements[token] ?? missingValue);
  });
}

export function buildWalkthroughPrompt(
  lessonTitle: string,
  context: StudentDesignContext | null,
) {
  if (!context?.isSignedIn) {
    return {
      heading: "Make this lesson personal after sign-in.",
      items: [
        "Sign in with the same email used for the assessments.",
        "The course will pull DesignID, DesignPD, and Spiritual Gifts records into the walkthrough.",
        "Future companion conversations can use this same student context.",
      ],
    };
  }

  if (!hasDesignIdData(context.designId)) {
    return {
      heading: "No DesignID record is attached yet.",
      items: [
        "Use the same email address from the DesignID assessment.",
        "Once connected, this panel will personalize each lesson from the student record.",
        "The HQ assessment vault shows what records are currently attached.",
      ],
    };
  }

  return {
    heading: `Read "${lessonTitle}" through your own DesignID pattern.`,
    items: [
      `Primary reflection: ${context.designId.primary || missingValue}.`,
      `Secondary reflection: ${context.designId.secondary || missingValue}.`,
      `Integrative reflection: ${
        context.designId.integrativeReflection || missingValue
      }.`,
      `Current growth watch: ${
        context.designId.reflectionShadow || missingValue
      }.`,
    ],
  };
}
