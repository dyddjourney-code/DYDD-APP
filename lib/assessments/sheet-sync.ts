import crypto from "node:crypto";
import fs from "node:fs";

import { google } from "googleapis";

import type { AssessmentSnapshotPayload, AssessmentType } from "./types";

export type AssessmentSourceName = "designid" | "designpd" | "spiritual_gifts";

type SourceConfig = {
  assessmentType: AssessmentType;
  emailColumn: string;
  envKey: string;
  nameColumn: string;
  profileColumns: string[];
  range: string;
  scoreColumns: string[];
  sourceSlug: string;
  submittedAtColumn?: string;
  summaryColumns: string[];
  timestampColumn: string;
};

export type AssessmentSyncResult = {
  applied: boolean;
  errors: { message: string; source: AssessmentSourceName; sourceResponseId?: string }[];
  payloads: number;
  rawRows: number;
  source: AssessmentSourceName;
};

export const assessmentSourceConfigs: Record<AssessmentSourceName, SourceConfig> = {
  designid: {
    assessmentType: "designid",
    emailColumn: "Email",
    envKey: "DESIGNID_PD_SPREADSHEET_ID",
    nameColumn: "Name",
    range: "Export_For_Results!A:BU",
    sourceSlug: "designid_export_for_results",
    timestampColumn: "Timestamp",
    scoreColumns: [
      "Architect_Pts",
      "Artisan_Pts",
      "Shepherd_Pts",
      "Steward_Pts",
      "Total_Pts",
      "Architect_Pct",
      "Artisan_Pct",
      "Shepherd_Pct",
      "Steward_Pct",
      "Band_Architect",
      "Band_Artisan",
      "Band_Shepherd",
      "Band_Steward",
      "Dreamer",
      "Doer",
      "Feel_It",
      "Think_It",
      "Solo",
      "Together",
      "Move_DreamerMinusDoer",
      "Move_Feel_ItMinusThink_It",
      "Move_SoloMinusTogether",
    ],
    summaryColumns: [
      "Primary",
      "Secondary",
      "PairKey",
      "Integrative_Reflection",
      "Reflection_Of_God",
      "Spiritual_Strength",
      "Potential_Shadow",
      "ReportReady",
    ],
    profileColumns: [
      "Primary_Text",
      "Secondary_Text",
      "Primary_Summary",
      "Secondary_Summary",
      "Integrative_Summary",
      "Approach_to_Learning",
      "Contribution_To_Body",
      "Shadow_Overview",
      "Shadow_Redemption",
    ],
  },
  designpd: {
    assessmentType: "designpd",
    emailColumn: "Email",
    envKey: "DESIGNID_PD_SPREADSHEET_ID",
    nameColumn: "Name",
    range: "DesignPD_Report_Data!A:DE",
    sourceSlug: "designpd_report_data",
    submittedAtColumn: "Helper_Key",
    timestampColumn: "Report_Date_Display",
    scoreColumns: [
      "Plan_Score",
      "Decide_Score",
      "Do_Score",
      "Plan_Tendency",
      "Decide_Tendency",
      "Do_Tendency",
      "Band_Architect",
      "Band_Artisan",
      "Band_Shepherd",
      "Band_Steward",
      "Move_DreamerMinusDoer",
      "Move_Feel_ItMinusThink_It",
      "Move_SoloMinusTogether",
    ],
    summaryColumns: [
      "Primary",
      "Secondary",
      "Integrative_Reflection",
      "Reflection_Shadow",
      "Plan_Descriptor",
      "Decide_Descriptor",
      "Do_Descriptor",
      "DesignPD_Processed",
      "DesignPD_Processed_Date",
      "DesignPD_Run_Source",
    ],
    profileColumns: [
      "Plan_Core_Block",
      "Decide_Core_Block",
      "Do_Core_Block",
      "Plan_Overview_Sentence",
      "Decide_Overview_Sentence",
      "Do_Overview_Sentence",
      "Conflict_Plan_Strength",
      "Collaboration_Decide_Strength",
      "Leadership_Do_Strength",
      "Sustainability_Do_Growth_Practice",
    ],
  },
  spiritual_gifts: {
    assessmentType: "spiritual_gifts",
    emailColumn: "Email_Address",
    envKey: "SPIRITUAL_GIFTS_SPREADSHEET_ID",
    nameColumn: "Full_Name",
    range: "Scores!A:CH",
    sourceSlug: "spiritual_gifts_scores",
    timestampColumn: "Timestamp",
    scoreColumns: [
      "ADMIN",
      "APOST",
      "CRAFT",
      "DISC",
      "EVANG",
      "EXHORT",
      "FAITH",
      "GIVE",
      "HEAL",
      "HELPS",
      "HOSP",
      "PRAY",
      "KNOW",
      "LEAD",
      "MERCY",
      "MIRAC",
      "MISS",
      "MUSIC",
      "PAST",
      "PROP",
      "SERVE",
      "TEACH",
      "TONG",
      "WISDOM",
      "Top1_Pct",
      "Top2_Pct",
      "Top3_Pct",
      "Top4_Pct",
      "Top5_Pct",
    ],
    summaryColumns: [
      "Top1_Name",
      "Top1_Score",
      "Top2_Name",
      "Top2_Score",
      "Top3_Name",
      "Top3_Score",
      "Top4_Name",
      "Top4_Score",
      "Top5_Name",
      "Top5_Score",
      "Document Merge Status - Spiritual Gifts Assessment",
    ],
    profileColumns: [
      "Top1_Blurb",
      "Top1_MaturityDescription",
      "Top1_GrowthAreas",
      "Top1_SignsOfImmaturity",
      "Top1_StepsToGrow",
      "Top2_Blurb",
      "Top3_Blurb",
      "Top4_Blurb",
      "Top5_Blurb",
    ],
  },
};

type SheetRecord = Record<string, string | number> & { __rowNumber: number };

function coerceValue(value: unknown) {
  if (typeof value !== "string") return value ?? "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const normalized = trimmed.replace(/,/g, "");
  if (/^-?\d+(\.\d+)?%?$/.test(normalized)) {
    const numberValue = Number(normalized.replace("%", ""));
    return trimmed.endsWith("%") ? numberValue / 100 : numberValue;
  }
  return trimmed;
}

function hash(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function normalizeEmail(value: unknown) {
  const email = String(value ?? "").trim().toLowerCase();
  if (!email.includes("@")) return "";
  const [localPart, domain] = email.split("@");
  if (domain === "gmail.com" || domain === "googlemail.com") {
    return `${localPart.split("+")[0].replaceAll(".", "")}@gmail.com`;
  }
  return email;
}

function pick(record: SheetRecord, columns: string[]) {
  return Object.fromEntries(
    columns
      .map((column) => [column, coerceValue(record[column])])
      .filter(([, value]) => value !== ""),
  );
}

function sourceSubmittedAt(config: SourceConfig, record: SheetRecord) {
  const raw = String(record[config.submittedAtColumn ?? config.timestampColumn] ?? "").trim();
  const serialMatch = raw.match(/\|(?<serial>\d{5,}(?:\.\d+)?)$/);
  const serialRaw = serialMatch?.groups?.serial ?? raw;
  const serialDate = Number(serialRaw);

  if (Number.isFinite(serialDate) && serialDate > 1_000_000_000_000) {
    const date = new Date(serialDate);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }

  if (Number.isFinite(serialDate) && serialDate > 1_000_000_000) {
    const date = new Date(serialDate * 1000);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }

  if (Number.isFinite(serialDate) && serialDate > 20000) {
    const googleEpochOffset = 25569;
    const millisecondsPerDay = 86400 * 1000;
    const date = new Date((serialDate - googleEpochOffset) * millisecondsPerDay);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }

  const parsed = Date.parse(raw);
  const date = new Date(parsed);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function sourceResponseId(config: SourceConfig, record: SheetRecord) {
  const timestamp = record[config.timestampColumn] ?? "";
  const email = normalizeEmail(record[config.emailColumn]);
  const name = String(record[config.nameColumn] ?? "").trim();
  const basis = [config.sourceSlug, timestamp, email, name, record.__rowNumber].join("|");
  return `${config.sourceSlug}:${hash(basis)}`;
}

export function toObjects(values: unknown[][]): SheetRecord[] {
  const [headers = [], ...rows] = values;

  return rows.map((row, rowIndex) => {
    const record = { __rowNumber: rowIndex + 2 } as SheetRecord;
    headers.forEach((header, index) => {
      if (header) {
        record[String(header)] = String(row[index] ?? "");
      }
    });
    return record;
  });
}

export function buildAssessmentPayload(
  config: SourceConfig,
  record: SheetRecord,
  syncBatchId: string,
): AssessmentSnapshotPayload {
  const participantEmail = normalizeEmail(record[config.emailColumn]);
  const participantName = String(record[config.nameColumn] ?? "").trim();
  const responseId = sourceResponseId(config, record);
  const fallbackKeyBasis = [config.sourceSlug, participantName, responseId].join("|");

  return {
    assessmentType: config.assessmentType,
    participantEmail: participantEmail || undefined,
    participantKey: participantEmail
      ? undefined
      : `dydd:${config.assessmentType}:${hash(fallbackKeyBasis)}`,
    participantName: participantName || undefined,
    profileLanguage: pick(record, config.profileColumns),
    scores: pick(record, config.scoreColumns),
    sourceResponseId: responseId,
    sourceSlug: config.sourceSlug,
    sourceSubmittedAt: sourceSubmittedAt(config, record),
    summary: pick(record, config.summaryColumns),
    syncBatchId,
  };
}

export function hasUsablePayload(payload: AssessmentSnapshotPayload) {
  return (
    Boolean(payload.participantEmail || payload.participantKey) &&
    Object.keys(payload.scores).length > 0 &&
    Object.keys(payload.summary ?? {}).length > 0
  );
}

function parseServiceAccount() {
  const json =
    process.env.DYDD_GOOGLE_SERVICE_ACCOUNT_JSON ??
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const b64 =
    process.env.DYDD_GOOGLE_SERVICE_ACCOUNT_B64 ??
    process.env.GOOGLE_SERVICE_ACCOUNT_B64;
  const keyFile =
    process.env.DYDD_GOOGLE_SERVICE_ACCOUNT_FILE ??
    process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (json) return JSON.parse(json);
  if (b64) return JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
  if (keyFile) return JSON.parse(fs.readFileSync(keyFile, "utf8"));

  throw new Error(
    "Missing Google service account credentials. Set DYDD_GOOGLE_SERVICE_ACCOUNT_B64 or DYDD_GOOGLE_SERVICE_ACCOUNT_JSON.",
  );
}

export async function readGoogleSheetValues(spreadsheetId: string, range: string) {
  const auth = new google.auth.GoogleAuth({
    credentials: parseServiceAccount(),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const sheets = google.sheets({ auth, version: "v4" });
  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  return response.data.values ?? [];
}

export async function buildSourcePayloads({
  limit = Number.POSITIVE_INFINITY,
  source,
  syncBatchId,
}: {
  limit?: number;
  source: AssessmentSourceName;
  syncBatchId: string;
}) {
  const config = assessmentSourceConfigs[source];
  const spreadsheetId = process.env[config.envKey];

  if (!spreadsheetId) {
    throw new Error(`Missing ${config.envKey}.`);
  }

  const values = await readGoogleSheetValues(spreadsheetId, config.range);
  const records = toObjects(values).filter((record) =>
    Object.values(record).some((value) => String(value ?? "").trim()),
  );
  const payloads = records
    .map((record) => buildAssessmentPayload(config, record, syncBatchId))
    .filter(hasUsablePayload)
    .slice(0, limit);

  return { payloads, rawRows: records.length };
}
