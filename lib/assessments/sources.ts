export type AssessmentSource = {
  envKey: string;
  isLiveProduction: boolean;
  label: string;
  slug: string;
  sourceSystem: "google_sheets";
  syncMode: "observe_then_mirror";
};

export const assessmentSources = [
  {
    envKey: "DESIGNID_PD_SPREADSHEET_ID",
    isLiveProduction: true,
    label: "DesignID / DesignPD",
    slug: "designid_designpd",
    sourceSystem: "google_sheets",
    syncMode: "observe_then_mirror",
  },
  {
    envKey: "SPIRITUAL_GIFTS_SPREADSHEET_ID",
    isLiveProduction: true,
    label: "Spiritual Gifts",
    slug: "spiritual_gifts",
    sourceSystem: "google_sheets",
    syncMode: "observe_then_mirror",
  },
] satisfies AssessmentSource[];
