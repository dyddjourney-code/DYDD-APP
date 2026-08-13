#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const SHEETS_AGENT = process.env.GOOGLE_SHEETS_AGENT ?? "/usr/local/bin/google-sheets-agent";
const DEFAULT_OUTPUT_DIR = "out/assessment-import";

const ignoredFruitLifeParticipantIds = new Set([
  "FL360-SAMPLE",
  "FL360-",
  "FL360-6613479139972243000",
  "FL360-6615917389977502768",
  "FL360-661OC201030",
  "FL360-6623764982748128899",
  "FL360-6623772952748222782",
]);

const ignoredFruitLifeParticipantNames = new Set([
  "George Jetson",
  "Greg Brady",
  "Miguel Papala",
  "OpenClaw SelfOnly 201030",
  "Rocky Balboa",
  "SelfOnly Test",
  "Wallace ObserverPath Test",
  "Wallace SelfOnly Test",
]);

const sourceConfigs = {
  designid: {
    assessmentType: "designid",
    envKey: "DESIGNID_PD_SPREADSHEET_ID",
    range: "Export_For_Results!A:BU",
    sourceSlug: "designid_export_for_results",
    timestampColumn: "Timestamp",
    emailColumn: "Email",
    nameColumn: "Name",
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
    envKey: "DESIGNID_PD_SPREADSHEET_ID",
    range: "DesignPD_Report_Data!A:DE",
    sourceSlug: "designpd_report_data",
    timestampColumn: "Report_Date_Display",
    submittedAtColumn: "Helper_Key",
    emailColumn: "Email",
    nameColumn: "Name",
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
    envKey: "SPIRITUAL_GIFTS_SPREADSHEET_ID",
    range: "Scores!A:CH",
    sourceSlug: "spiritual_gifts_scores",
    timestampColumn: "Timestamp",
    emailColumn: "Email_Address",
    nameColumn: "Full_Name",
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
  fruit_360: {
    assessmentType: "fruit_360",
    envKey: "FRUITLIFE_360_SPREADSHEET_ID",
    range: "Report_Export_360!A:IZ",
    sourceSlug: "fruitlife_360_report_export",
    timestampColumn: "Report_Date",
    responseIdColumn: "Participant_ID",
    emailColumn: "Participant_Email",
    nameColumn: "Participant_Name",
    scoreColumns: [
      "Response_Count",
      "Observer_Count",
      "Self_Overall",
      "Observer_Overall",
      "Overall_Gap",
      "Love_Self",
      "Love_Observer",
      "Love_Self_Pressure",
      "Love_Observer_Pressure",
      "Joy_Self",
      "Joy_Observer",
      "Joy_Self_Pressure",
      "Joy_Observer_Pressure",
      "Peace_Self",
      "Peace_Observer",
      "Peace_Self_Pressure",
      "Peace_Observer_Pressure",
      "Patience_Self",
      "Patience_Observer",
      "Patience_Self_Pressure",
      "Patience_Observer_Pressure",
      "Kindness_Self",
      "Kindness_Observer",
      "Kindness_Self_Pressure",
      "Kindness_Observer_Pressure",
      "Goodness_Self",
      "Goodness_Observer",
      "Goodness_Self_Pressure",
      "Goodness_Observer_Pressure",
      "Faithfulness_Self",
      "Faithfulness_Observer",
      "Faithfulness_Self_Pressure",
      "Faithfulness_Observer_Pressure",
      "Gentleness_Self",
      "Gentleness_Observer",
      "Gentleness_Self_Pressure",
      "Gentleness_Observer_Pressure",
      "Self-control_Self",
      "Self-control_Observer",
      "Self-control_Self_Pressure",
      "Self-control_Observer_Pressure",
      "Love_Rank",
      "Joy_Rank",
      "Peace_Rank",
      "Patience_Rank",
      "Kindness_Rank",
      "Goodness_Rank",
      "Faithfulness_Rank",
      "Gentleness_Rank",
      "Self-control_Rank",
    ],
    summaryColumns: [
      "Participant_ID",
      "Report_Date",
      "Reviewer_Mix",
      "Most_Visible_Fruit",
      "Encouragement_Others_See",
      "Growth_Invitations",
      "Pressure_Vulnerabilities",
      "Most_Visible_Fruit_List",
      "Steady_Forming_Fruit_List",
      "Growth_Invitation_Fruit_List",
      "Report_Mode",
    ],
    profileColumns: [
      "Overview_Note",
      "Love_Category",
      "Love_Summary",
      "Love_Tier_Label",
      "Love_Tier_Description",
      "Love_Growth_Invitation",
      "Love_Practice",
      "Joy_Category",
      "Joy_Summary",
      "Joy_Tier_Label",
      "Joy_Tier_Description",
      "Joy_Growth_Invitation",
      "Joy_Practice",
      "Peace_Category",
      "Peace_Summary",
      "Peace_Tier_Label",
      "Peace_Tier_Description",
      "Peace_Growth_Invitation",
      "Peace_Practice",
      "Patience_Category",
      "Patience_Summary",
      "Patience_Tier_Label",
      "Patience_Tier_Description",
      "Patience_Growth_Invitation",
      "Patience_Practice",
      "Kindness_Category",
      "Kindness_Summary",
      "Kindness_Tier_Label",
      "Kindness_Tier_Description",
      "Kindness_Growth_Invitation",
      "Kindness_Practice",
      "Goodness_Category",
      "Goodness_Summary",
      "Goodness_Tier_Label",
      "Goodness_Tier_Description",
      "Goodness_Growth_Invitation",
      "Goodness_Practice",
      "Faithfulness_Category",
      "Faithfulness_Summary",
      "Faithfulness_Tier_Label",
      "Faithfulness_Tier_Description",
      "Faithfulness_Growth_Invitation",
      "Faithfulness_Practice",
      "Gentleness_Category",
      "Gentleness_Summary",
      "Gentleness_Tier_Label",
      "Gentleness_Tier_Description",
      "Gentleness_Growth_Invitation",
      "Gentleness_Practice",
      "Self-control_Category",
      "Self-control_Summary",
      "Self_control_Tier_Label",
      "Self_control_Tier_Description",
      "Self_control_Growth_Invitation",
      "Self_control_Practice",
      "Love_Consistency_Note",
      "Love_Pressure_Note",
      "Joy_Consistency_Note",
      "Joy_Pressure_Note",
      "Peace_Consistency_Note",
      "Peace_Pressure_Note",
      "Patience_Consistency_Note",
      "Patience_Pressure_Note",
      "Kindness_Consistency_Note",
      "Kindness_Pressure_Note",
      "Goodness_Consistency_Note",
      "Goodness_Pressure_Note",
      "Faithfulness_Consistency_Note",
      "Faithfulness_Pressure_Note",
      "Gentleness_Consistency_Note",
      "Gentleness_Pressure_Note",
      "Self-control_Consistency_Note",
      "Self-control_Pressure_Note",
    ],
  },
};

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  return Object.fromEntries(
    fs
      .readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        const key = line.slice(0, index).trim();
        const value = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
        return [key, value];
      }),
  );
}

function parseArgs(argv) {
  const args = {
    apply: false,
    limit: Number.POSITIVE_INFINITY,
    outDir: DEFAULT_OUTPUT_DIR,
    sources: Object.keys(sourceConfigs),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--apply") {
      args.apply = true;
    } else if (arg === "--source") {
      args.sources = argv[++index].split(",").map((source) => source.trim());
    } else if (arg === "--limit") {
      args.limit = Number(argv[++index]);
    } else if (arg === "--out-dir") {
      args.outDir = argv[++index];
    } else if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  for (const source of args.sources) {
    if (!sourceConfigs[source]) {
      throw new Error(`Unknown source: ${source}`);
    }
  }

  if (!Number.isFinite(args.limit) && args.limit !== Number.POSITIVE_INFINITY) {
    throw new Error("--limit must be a number.");
  }

  return args;
}

function printUsage() {
  console.log(`Usage:
  node scripts/import-assessment-snapshots.mjs [--source designid,designpd,spiritual_gifts,fruit_360] [--limit 25] [--out-dir out/assessment-import] [--apply]

Default mode is a dry run. It writes JSONL payloads and a summary report under out/assessment-import.
Use --apply only when DYDD_APP_URL and DYDD_ASSESSMENT_SYNC_SECRET are set and you intend to write to Supabase.`);
}

function readSheet(spreadsheetId, range) {
  const result = spawnSync(SHEETS_AGENT, ["read", spreadsheetId, range], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 25,
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || `google-sheets-agent failed for ${range}`);
  }

  return JSON.parse(result.stdout).values ?? [];
}

function toObjects(values) {
  const [headers = [], ...rows] = values;

  return rows.map((row, rowIndex) => {
    const record = { __rowNumber: rowIndex + 2 };
    headers.forEach((header, index) => {
      if (header) {
        record[header] = row[index] ?? "";
      }
    });
    return record;
  });
}

function pick(record, columns) {
  return Object.fromEntries(
    columns
      .map((column) => [column, coerceValue(record[column])])
      .filter(([, value]) => value !== ""),
  );
}

function coerceValue(value) {
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

function normalizeEmail(value) {
  const email = String(value ?? "").trim().toLowerCase();
  if (!email.includes("@")) return "";

  const [localPart, domain] = email.split("@");

  if (domain === "gmail.com" || domain === "googlemail.com") {
    return `${localPart.split("+")[0].replaceAll(".", "")}@gmail.com`;
  }

  return email;
}

function hash(value) {
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function sourceResponseId(config, record) {
  const configuredId = String(record[config.responseIdColumn ?? ""] ?? "").trim();
  if (configuredId) {
    return `${config.sourceSlug}:${configuredId}`;
  }

  const timestamp = record[config.timestampColumn] ?? "";
  const email = normalizeEmail(record[config.emailColumn]);
  const name = String(record[config.nameColumn] ?? "").trim();
  const basis = [config.sourceSlug, timestamp, email, name, record.__rowNumber].join("|");
  return `${config.sourceSlug}:${hash(basis)}`;
}

function sourceSubmittedAt(config, record) {
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

function buildPayload(config, record, syncBatchId) {
  const participantEmail = normalizeEmail(record[config.emailColumn]);
  const participantName = String(record[config.nameColumn] ?? "").trim();
  const responseId = sourceResponseId(config, record);
  const fallbackKeyBasis = [config.sourceSlug, participantName, responseId].join("|");

  return {
    assessmentType: config.assessmentType,
    participantEmail: participantEmail || undefined,
    participantKey:
      participantEmail || !participantName
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

function hasUsablePayload(payload) {
  if (payload.assessmentType === "fruit_360") {
    const participantId = String(payload.summary?.Participant_ID ?? "").trim();
    const participantName = (payload.participantName ?? "").replace(/\s+/g, " ").trim();

    if (
      ignoredFruitLifeParticipantIds.has(participantId) ||
      ignoredFruitLifeParticipantNames.has(participantName)
    ) {
      return false;
    }
  }

  return (
    Boolean(payload.participantEmail || payload.participantKey) &&
    Object.keys(payload.scores).length > 0 &&
    Object.keys(payload.summary).length > 0
  );
}

async function applyPayload(payload) {
  const appUrl = process.env.DYDD_APP_URL;
  const syncSecret = process.env.DYDD_ASSESSMENT_SYNC_SECRET;

  if (!appUrl || !syncSecret) {
    throw new Error("DYDD_APP_URL and DYDD_ASSESSMENT_SYNC_SECRET are required for --apply.");
  }

  const response = await fetch(new URL("/api/assessment-snapshots", appUrl), {
    method: "POST",
    headers: {
      authorization: `Bearer ${syncSecret}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Apply failed for ${payload.sourceResponseId}: ${response.status} ${body}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const env = { ...parseEnvFile(".env.local"), ...process.env };
  const outputDir = path.resolve(args.outDir);
  const syncBatchId = `dryrun-${new Date().toISOString()}`;
  fs.mkdirSync(outputDir, { recursive: true });

  const summaries = [];

  for (const sourceName of args.sources) {
    const config = sourceConfigs[sourceName];
    const spreadsheetId = env[config.envKey];

    if (!spreadsheetId) {
      throw new Error(`Missing ${config.envKey}. Set it in .env.local or the environment.`);
    }

    const values = readSheet(spreadsheetId, config.range);
    const records = toObjects(values).filter((record) =>
      Object.values(record).some((value) => String(value ?? "").trim()),
    );
    const payloads = records
      .map((record) => buildPayload(config, record, syncBatchId))
      .filter(hasUsablePayload)
      .slice(0, args.limit);

    const outputPath = path.join(outputDir, `${sourceName}.jsonl`);
    fs.writeFileSync(
      outputPath,
      payloads.length
        ? `${payloads.map((payload) => JSON.stringify(payload)).join("\n")}\n`
        : "",
    );

    if (args.apply) {
      for (const payload of payloads) {
        await applyPayload(payload);
      }
    }

    summaries.push({
      applied: args.apply,
      outputPath,
      payloads: payloads.length,
      rawRows: records.length,
      source: sourceName,
    });
  }

  const reportPath = path.join(outputDir, "summary.json");
  fs.writeFileSync(reportPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), summaries }, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, summaries }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
