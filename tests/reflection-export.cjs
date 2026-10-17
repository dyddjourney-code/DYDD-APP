const assert = require("node:assert/strict");
const load = require("../scripts/fruitlife-test-load.cjs");
const { reflectionExportText } = load("lib/reflections/export.ts");
const q = {
  id: "q",
  prompt: "What changed? <hope>",
  moduleTitle: "Purpose",
  lessonTitle: "Look back",
  lessonSlug: "back",
  version: "v1",
};
const rounds = [
  {
    id: "round",
    course_slug: "spiritual-gifts-service",
    started_at: "2026-10-17T16:00:00Z",
    questions: [q, { ...q, id: "blank", prompt: "Still unanswered?" }],
  },
];
const entries = [
  {
    id: "e1",
    round_id: "round",
    question_id: "q",
    revision: 1,
    response: "Original",
    saved_at: "2026-10-17T16:00:00Z",
  },
  {
    id: "e2",
    round_id: "round",
    question_id: "q",
    revision: 2,
    response: "Updated reflection & purpose",
    saved_at: "2026-10-17T17:00:00Z",
  },
  {
    id: "foreign",
    round_id: "foreign",
    question_id: "q",
    revision: 9,
    response: "Private other account",
    saved_at: "2026-10-17T17:00:00Z",
  },
];
const text = reflectionExportText(rounds, entries);
assert(text.includes("Spiritual Gifts"));
assert(text.includes("What changed? <hope>"));
assert(text.includes("Updated reflection & purpose"));
assert(text.includes("Still unanswered?"));
assert(text.includes("[Not answered in this walkthrough]"));
assert(!text.includes("Original"));
assert(!text.includes("Private other account"));
let user = {
    id: "account",
    email: "verified@example.invalid",
    email_confirmed_at: "2026-10-17",
  },
  sent,
  fail = false;
const query = (data) =>
  new Proxy(
    {},
    {
      get: (_, k) =>
        k === "then"
          ? (resolve) => resolve({ data, error: null })
          : () => query(data),
    },
  );
const db = {
  auth: { getUser: async () => ({ data: { user } }) },
  from: (table) =>
    query(
      table === "reflection_rounds"
        ? rounds
        : entries.filter((e) => e.round_id === "round"),
    ),
};
const route = load("app/api/course-reflections/export/route.ts", {
  "@/lib/reflections/preview": {previewParams: () => null},
  "@/lib/supabase/server": { createSupabaseServerClient: async () => db },
  "@/lib/email/resend": {
    sendResendEmail: async (input) => {
      sent = input;
      return { sent: !fail, skipped: false };
    },
  },
});
(async () => {
  const request = () =>
    new Request(
      "https://school.test/api/course-reflections/export?scope=all&to=attacker@example.invalid",
      { method: "POST", headers: { Origin: "https://school.test" } },
    );
  let response = await route.POST(request());
  assert.equal(response.status, 200);
  assert.equal(sent.to, user.email);
  assert(sent.text.includes("Updated reflection"));
  assert.equal(
    Buffer.from(sent.attachments[0].content, "base64").toString(),
    sent.text,
  );
  assert(sent.html.includes("&lt;hope&gt;"));
  assert(!sent.html.includes("<hope>"));
  const key = sent.idempotencyKey;
  response = await route.POST(request());
  assert.equal(sent.idempotencyKey, key);
  fail = true;
  response = await route.POST(request());
  assert.equal(response.status, 502);
  assert.match((await response.json()).error, /download/i);
  user = { ...user, email_confirmed_at: null };
  response = await route.POST(request());
  assert.equal(response.status, 403);
  user = null;
  response = await route.GET(
    new Request("https://school.test/api/course-reflections/export?scope=all"),
  );
  assert.equal(response.status, 401);
  response = await route.POST(
    new Request("https://school.test/api/course-reflections/export?scope=all", {
      method: "POST",
      headers: { Origin: "https://elsewhere.test" },
    }),
  );
  assert.equal(response.status, 403);
  console.log(
    "PASS text export: exact latest answers, dated rounds, full questions, explicit blanks, no foreign data.",
  );
  console.log(
    "PASS self-email: verified account recipient only, HTML escaping, matching text attachment, idempotency, provider failure, anonymous and foreign-origin denial (mock transport; no email sent).",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
