export type AssessmentSource = {
  assessmentTypes: string[];
  envKey: string;
  isLiveProduction: boolean;
  label: string;
  slug: string;
  sourceSystem: "google_sheets";
  syncMode: "observe_then_mirror";
};

export const assessmentSources = [
  {
    assessmentTypes: ["designid", "designpd"],
    envKey: "DESIGNID_PD_SPREADSHEET_ID",
    isLiveProduction: true,
    label: "DesignID / DesignPD",
    slug: "designid_designpd",
    sourceSystem: "google_sheets",
    syncMode: "observe_then_mirror",
  },
  {
    assessmentTypes: ["spiritual_gifts"],
    envKey: "SPIRITUAL_GIFTS_SPREADSHEET_ID",
    isLiveProduction: true,
    label: "Spiritual Gifts",
    slug: "spiritual_gifts",
    sourceSystem: "google_sheets",
    syncMode: "observe_then_mirror",
  },
] satisfies AssessmentSource[];
