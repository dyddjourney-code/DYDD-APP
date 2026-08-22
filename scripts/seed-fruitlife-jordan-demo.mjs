import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const secretPath = "/home/openclaw/.openclaw/secrets/dydd-online-school-supabase.json";

const fruits = [
  { key: "love", label: "Love", scoreKey: "Love" },
  { key: "joy", label: "Joy", scoreKey: "Joy" },
  { key: "peace", label: "Peace", scoreKey: "Peace" },
  { key: "patience", label: "Patience", scoreKey: "Patience" },
  { key: "kindness", label: "Kindness", scoreKey: "Kindness" },
  { key: "goodness", label: "Goodness", scoreKey: "Goodness" },
  { key: "faithfulness", label: "Faithfulness", scoreKey: "Faithfulness" },
  { key: "gentleness", label: "Gentleness", scoreKey: "Gentleness" },
  { key: "self_control", label: "Self-Control", scoreKey: "Self-control" },
];

const questionCodes = {
  faithfulness: ["FAITHFULNESS_01", "FAITHFULNESS_02", "FAITHFULNESS_03"],
  gentleness: ["GENTLENESS_01", "GENTLENESS_02", "GENTLENESS_03"],
  goodness: ["GOODNESS_01", "GOODNESS_02", "GOODNESS_03"],
  joy: ["JOY_01", "JOY_02", "JOY_03"],
  kindness: ["KINDNESS_01", "KINDNESS_02", "KINDNESS_03"],
  love: ["LOVE_01", "LOVE_02", "LOVE_03"],
  patience: ["PATIENCE_01", "PATIENCE_02", "PATIENCE_03"],
  peace: ["PEACE_01", "PEACE_02", "PEACE_03"],
  self_control: ["SELFCONTROL_01", "SELFCONTROL_02", "SELFCONTROL_03"],
};

const participant = {
  email: "j94gray@gmail.com",
  name: "Jordan Gray",
};

const runs = [
  {
    date: "2026-06-22T14:30:00.000Z",
    id: "FL360-JORDAN-DEMO-SELF-2026-06",
    mode: "SELF_ONLY",
    observerCount: 0,
    rank: ["faithfulness", "kindness", "love", "goodness", "peace", "joy", "patience", "gentleness", "self_control"],
    self: {
      faithfulness: 4.7,
      gentleness: 2.7,
      goodness: 4.0,
      joy: 3.4,
      kindness: 4.5,
      love: 4.2,
      patience: 3.1,
      peace: 3.6,
      self_control: 2.5,
    },
  },
  {
    date: "2026-06-24T16:15:00.000Z",
    id: "FL360-JORDAN-DEMO-360-2026-06",
    mode: "FULL_360",
    observerCount: 3,
    rank: ["kindness", "faithfulness", "love", "goodness", "peace", "joy", "patience", "gentleness", "self_control"],
    self: {
      faithfulness: 4.5,
      gentleness: 2.9,
      goodness: 4.1,
      joy: 3.5,
      kindness: 4.6,
      love: 4.3,
      patience: 3.0,
      peace: 3.7,
      self_control: 2.7,
    },
    observer: {
      faithfulness: 4.3,
      gentleness: 2.8,
      goodness: 3.8,
      joy: 3.2,
      kindness: 4.6,
      love: 4.1,
      patience: 2.9,
      peace: 3.4,
      self_control: 2.6,
    },
  },
  {
    date: "2026-08-22T18:40:00.000Z",
    id: "FL360-JORDAN-DEMO-360-2026-08",
    mode: "FULL_360",
    observerCount: 3,
    rank: ["peace", "kindness", "faithfulness", "love", "goodness", "joy", "gentleness", "patience", "self_control"],
    self: {
      faithfulness: 4.6,
      gentleness: 3.5,
      goodness: 4.2,
      joy: 3.8,
      kindness: 4.7,
      love: 4.4,
      patience: 3.4,
      peace: 4.5,
      self_control: 3.1,
    },
    observer: {
      faithfulness: 4.5,
      gentleness: 3.4,
      goodness: 4.0,
      joy: 3.6,
      kindness: 4.7,
      love: 4.3,
      patience: 3.3,
      peace: 4.4,
      self_control: 3.0,
    },
  },
];

function readSecretConfig() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    };
  }

  const secret = JSON.parse(fs.readFileSync(secretPath, "utf8"));
  return {
    serviceRoleKey: secret.service_role_key,
    url: secret.project_url || `https://${secret.ref}.supabase.co`,
  };
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function rounded(value) {
  return Math.round(value * 100) / 100;
}

function splitAverage(value, bump = 0) {
  const base = Number(value);
  return [
    Math.max(1, Math.min(5, rounded(base - 0.2 + bump))),
    Math.max(1, Math.min(5, rounded(base + 0.1 + bump))),
    Math.max(1, Math.min(5, rounded(base + 0.1 - bump))),
  ];
}

function answersFromScores(scores, bump = 0) {
  const fruitRatings = {};
  const fruitAverages = {};
  const questionScores = {};

  for (const fruit of fruits) {
    const values = splitAverage(scores[fruit.key], bump);
    const answers = {};
    questionCodes[fruit.key].forEach((code, index) => {
      answers[code] = values[index];
      questionScores[code] = values[index];
    });
    const average = rounded(values.reduce((sum, value) => sum + value, 0) / values.length);
    answers.visible = average;
    answers.consistent = average;
    answers.pressure = values[2];
    fruitRatings[fruit.key] = answers;
    fruitAverages[fruit.key] = average;
  }

  return { fruitAverages, fruitRatings, questionScores };
}

function fruitList(rank, start, end) {
  return rank.slice(start, end).map((key) => fruits.find((fruit) => fruit.key === key)?.label ?? key).join(", ");
}

function buildSnapshotPayload(run) {
  const scores = {};
  const profileLanguage = {};
  const sourceScores = run.observer ?? run.self;

  for (const fruit of fruits) {
    const selfScore = rounded(run.self[fruit.key]);
    const observerScore = rounded(sourceScores[fruit.key]);
    const rank = run.rank.indexOf(fruit.key) + 1;
    scores[`${fruit.scoreKey}_Self`] = selfScore;
    scores[`${fruit.scoreKey}_Observer`] = observerScore;
    scores[`${fruit.scoreKey}_Self_Pressure`] = rounded(Math.max(1, selfScore - 0.3));
    scores[`${fruit.scoreKey}_Observer_Pressure`] = rounded(Math.max(1, observerScore - 0.2));
    scores[`${fruit.scoreKey}_Rank`] = rank;
    profileLanguage[`${fruit.scoreKey}_Category`] =
      rank <= 3 ? "Most Visible Fruit" : rank <= 6 ? "Steady Forming Fruit" : "Growth Invitation Fruit";
    profileLanguage[`${fruit.scoreKey}_Practice`] =
      rank <= 3
        ? `Give thanks for visible ${fruit.label.toLowerCase()} and practice it deliberately this week.`
        : `Choose one small place to let ${fruit.label.toLowerCase()} become more visible.`;
    profileLanguage[`${fruit.scoreKey}_Summary`] =
      `${fruit.label} is tracking at ${observerScore.toFixed(1)} in this dated FruitLife run.`;
  }

  scores.Observer_Count = run.observerCount;
  scores.Response_Count = 1 + run.observerCount;

  return {
    profileLanguage,
    scores,
    summary: {
      Growth_Invitation_Fruit_List: fruitList(run.rank, 6, 9),
      Growth_Invitations: `${fruitList(run.rank, 6, 9)} are the current growth invitations.`,
      Most_Visible_Fruit: fruits.find((fruit) => fruit.key === run.rank[0])?.label ?? "",
      Most_Visible_Fruit_List: fruitList(run.rank, 0, 3),
      Participant_ID: run.id,
      Pressure_Vulnerabilities: "Notice where stress changes the visibility of fruit.",
      Report_Date: new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(run.date)),
      Report_Mode: run.mode,
      Reviewer_Mix:
        run.observerCount > 0
          ? `1 self response and ${run.observerCount} observer responses are included.`
          : "Jordan completed this as a self-reflection report with no observer responses.",
      Steady_Forming_Fruit_List: fruitList(run.rank, 3, 6),
    },
  };
}

async function throwIfError(result, label) {
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`);
  }
  return result.data;
}

async function main() {
  const { serviceRoleKey, url } = readSecretConfig();
  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const now = new Date().toISOString();
  const sourceIds = runs.map((run) => run.id);

  const participantRow = await throwIfError(
    await supabase
      .from("assessment_participants")
      .upsert(
        {
          display_name: participant.name,
          normalized_email: participant.email,
          updated_at: now,
        },
        { onConflict: "normalized_email" },
      )
      .select("id")
      .single(),
    "upsert participant",
  );

  const existingSessions = await throwIfError(
    await supabase
      .from("fruitlife_360_sessions")
      .select("id")
      .in("source_participant_id", sourceIds),
    "find existing demo sessions",
  );
  const existingSessionIds = existingSessions.map((session) => session.id);

  if (existingSessionIds.length) {
    await throwIfError(
      await supabase.from("fruitlife_360_report_artifacts").delete().in("session_id", existingSessionIds),
      "delete demo artifacts",
    );
    await throwIfError(
      await supabase.from("fruitlife_360_report_jobs").delete().in("session_id", existingSessionIds),
      "delete demo jobs",
    );
    await throwIfError(
      await supabase.from("fruitlife_360_responses").delete().in("session_id", existingSessionIds),
      "delete demo responses",
    );
    await throwIfError(
      await supabase.from("fruitlife_360_observer_invites").delete().in("session_id", existingSessionIds),
      "delete demo invites",
    );
    await throwIfError(
      await supabase.from("fruitlife_360_sessions").delete().in("id", existingSessionIds),
      "delete demo sessions",
    );
  }

  await throwIfError(
    await supabase
      .from("assessment_snapshots")
      .delete()
      .eq("assessment_type", "fruit_360")
      .eq("source", "fruitlife_360_jordan_demo")
      .in("source_response_id", sourceIds),
    "delete demo snapshots",
  );

  const created = [];

  for (const run of runs) {
    const selfToken = crypto.randomBytes(18).toString("base64url");
    let selfLink = "";
    const observerLinks = Array.from({ length: run.observerCount }, (_, index) => {
      const token = crypto.randomBytes(18).toString("base64url");
      return {
        email: `observer${index + 1}+${run.id.toLowerCase()}@example.com`,
        link: "",
        name: ["Mara Ellis", "Caleb North", "Tessa Vale"][index] ?? `Observer ${index + 1}`,
        relationship: ["Peer", "Leader", "Friend"][index] ?? "Observer",
        token,
      };
    });

    const session = await throwIfError(
      await supabase
        .from("fruitlife_360_sessions")
        .insert({
          created_at: run.date,
          intake_token_hash: hashToken(selfToken),
          metadata: {
            demoSeed: true,
            observerLinks: observerLinks.map(({ token, ...observer }) => observer),
            selfLink,
            source: "jordan_demo_seed",
          },
          observer_completed_count: run.observerCount,
          observer_goal: run.observerCount,
          participant_email: participant.email,
          participant_id: participantRow.id,
          participant_name: participant.name,
          report_mode: run.mode,
          report_status: "ready",
          response_count: 1 + run.observerCount,
          self_completed_at: run.date,
          session_status: "report_ready",
          signup_source: "jordan-demo-seed",
          source_participant_id: run.id,
          source_system: "vercel_jordan_demo",
          source_synced_at: run.date,
          updated_at: run.date,
        })
        .select("id")
        .single(),
      `insert session ${run.id}`,
    );

    selfLink = `https://dydd-online-school.vercel.app/fruitlife360/self?session=${session.id}&token=${selfToken}`;
    for (const observer of observerLinks) {
      observer.link = `https://dydd-online-school.vercel.app/fruitlife360/observer?session=${session.id}&token=${observer.token}`;
    }

    await throwIfError(
      await supabase
        .from("fruitlife_360_sessions")
        .update({
          metadata: {
            demoSeed: true,
            observerLinks: observerLinks.map(({ token, ...observer }) => observer),
            selfLink,
            source: "jordan_demo_seed",
          },
        })
        .eq("id", session.id),
      `update session links ${run.id}`,
    );

    if (observerLinks.length) {
      await throwIfError(
        await supabase.from("fruitlife_360_observer_invites").insert(
          observerLinks.map((observer) => ({
            completed_at: run.date,
            created_at: run.date,
            invite_status: "completed",
            invite_token_hash: hashToken(observer.token),
            invited_at: run.date,
            metadata: {
              demoSeed: true,
              observerLink: observer.link,
            },
            observer_email: observer.email,
            observer_name: observer.name,
            relationship_label: observer.relationship,
            session_id: session.id,
            source_response_id: `${run.id}:observer:${observer.email}`,
            updated_at: run.date,
          })),
        ),
        `insert invites ${run.id}`,
      );
    }

    const selfAnswers = answersFromScores(run.self);
    await throwIfError(
      await supabase.from("fruitlife_360_responses").insert({
        answers: {
          fruitRatings: selfAnswers.fruitRatings,
          reflections: {
            encouragement: "This demo self reflection names steady care and follow-through.",
            growth: "This demo self reflection invites more peace under pressure.",
            strength: "This demo self reflection sees kindness and faithfulness as visible strengths.",
          },
        },
        created_at: run.date,
        derived_scores: {
          fruitAverages: selfAnswers.fruitAverages,
          growthFocus: run.rank.slice(-3),
          mostVisible: run.rank.slice(0, 3),
          questionScores: selfAnswers.questionScores,
        },
        fruit_rank: run.rank,
        relationship_label: "Self",
        response_type: "self",
        reviewer_email: participant.email,
        reviewer_name: participant.name,
        session_id: session.id,
        source_response_id: `${run.id}:self`,
        source_system: "jordan_demo_seed",
        submitted_at: run.date,
        updated_at: run.date,
      }),
      `insert self response ${run.id}`,
    );

    for (let index = 0; index < run.observerCount; index += 1) {
      const observer = observerLinks[index];
      const observerBase = run.observer ?? run.self;
      const observerAnswers = answersFromScores(observerBase, (index - 1) * 0.08);
      await throwIfError(
        await supabase.from("fruitlife_360_responses").insert({
          answers: {
            fruitRatings: observerAnswers.fruitRatings,
            reflections: {
              encouragement: `${observer.name} notices steady relational fruit in this demo run.`,
              growth: `${observer.name} sees room for formation in pressure moments.`,
              strength: `${observer.name} names ${fruitList(run.rank, 0, 2)} as visible strengths.`,
            },
          },
          created_at: run.date,
          derived_scores: {
            fruitAverages: observerAnswers.fruitAverages,
            growthFocus: run.rank.slice(-3),
            mostVisible: run.rank.slice(0, 3),
            questionScores: observerAnswers.questionScores,
          },
          fruit_rank: run.rank,
          relationship_label: observer.relationship,
          response_type: "observer",
          reviewer_email: observer.email,
          reviewer_name: observer.name,
          session_id: session.id,
          source_response_id: `${run.id}:observer:${index + 1}`,
          source_system: "jordan_demo_seed",
          submitted_at: run.date,
          updated_at: run.date,
        }),
        `insert observer response ${run.id}:${index + 1}`,
      );
    }

    const snapshotPayload = buildSnapshotPayload(run);
    const snapshot = await throwIfError(
      await supabase
        .from("assessment_snapshots")
        .insert({
          assessment_type: "fruit_360",
          created_at: run.date,
          participant_id: participantRow.id,
          scores: snapshotPayload,
          source: "fruitlife_360_jordan_demo",
          source_response_id: run.id,
          source_submitted_at: run.date,
          sync_batch_id: "jordan-demo-fruitlife-timeline",
        })
        .select("id")
        .single(),
      `insert snapshot ${run.id}`,
    );

    const job = await throwIfError(
      await supabase
        .from("fruitlife_360_report_jobs")
        .insert({
          completed_at: run.date,
          created_at: run.date,
          job_status: "ready",
          job_type: "fruitlife_360_payload",
          metadata: {
            demoSeed: true,
            reportMode: run.mode,
            snapshotId: snapshot.id,
          },
          payload: snapshotPayload,
          queued_at: run.date,
          session_id: session.id,
          updated_at: run.date,
        })
        .select("id")
        .single(),
      `insert job ${run.id}`,
    );

    await throwIfError(
      await supabase.from("fruitlife_360_report_artifacts").insert([
        {
          artifact_status: "ready",
          artifact_type: "payload",
          content_type: "application/json",
          created_at: run.date,
          filename: `${run.id.toLowerCase()}-payload.json`,
          metadata: {
            demoSeed: true,
            fieldCount:
              Object.keys(snapshotPayload.summary).length +
              Object.keys(snapshotPayload.profileLanguage).length +
              Object.keys(snapshotPayload.scores).length,
            snapshotId: snapshot.id,
          },
          provider: "vercel",
          provider_document_id: run.id,
          report_job_id: job.id,
          session_id: session.id,
          updated_at: run.date,
        },
        {
          artifact_status: "ready",
          artifact_type: "web_report",
          content_type: "text/html",
          created_at: run.date,
          filename: `${run.id.toLowerCase()}-report-preview.html`,
          metadata: {
            demoSeed: true,
            reportMode: run.mode,
            snapshotId: snapshot.id,
          },
          provider: "vercel",
          provider_document_id: `${run.id}:web`,
          report_job_id: job.id,
          session_id: session.id,
          updated_at: run.date,
        },
      ]),
      `insert artifacts ${run.id}`,
    );

    await throwIfError(
      await supabase
        .from("fruitlife_360_sessions")
        .update({ report_snapshot_id: snapshot.id })
        .eq("id", session.id),
      `link snapshot ${run.id}`,
    );

    created.push({ mode: run.mode, run: run.id, sessionId: session.id, snapshotId: snapshot.id });
  }

  console.log(JSON.stringify({ created, participant: participant.email }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
