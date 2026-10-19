import fs from "node:fs";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url),
  load = require("../scripts/fruitlife-test-load.cjs");
const m = load("lib/circles/plan.ts");
process.loadEnvFile(".env.runtime");
if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY ||
  !process.env.DYDD_REVIEW_TOKEN
)
  throw Error(
    "Configure the app credentials before running Circle integration tests.",
  );
const base = process.env.CIRCLE_TEST_BASE || "http://localhost:3099";
const query = new URLSearchParams({
  review: "owner",
  key: process.env.DYDD_REVIEW_TOKEN,
});
const headers = { "Content-Type": "application/json" };
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);
const ids = [],
  users = [];
async function request(method, path, body, cookie, extra = {}) {
  const r = await fetch(base + path, {
    method,
    headers: { ...headers, ...(cookie ? { cookie } : {}), ...extra },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const type = r.headers.get("content-type");
  return {
    status: r.status,
    data: type?.includes("json")
      ? await r.json()
      : Buffer.from(await r.arrayBuffer()),
    headers: r.headers,
  };
}
async function testUser() {
  const email = `circle-qa-${crypto.randomUUID()}@example.com`,
    password = crypto.randomBytes(24).toString("hex");
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  assert(!created.error);
  users.push(created.data.user.id);
  let cookies = [];
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookies,
        setAll: (c) => {
          cookies = c;
        },
      },
    },
  );
  const signed = await client.auth.signInWithPassword({ email, password });
  assert(!signed.error);
  return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
}
try {
  assert.equal((await request("GET", "/api/circles")).status, 401);
  assert.equal(
    (await request("GET", "/api/circles?review=owner&key=invalid")).status,
    401,
  );
  const cookie = await testUser(),
    other = await testUser();
  const id = crypto.randomUUID();
  ids.push(id);
  let plan = {
    ...m.blankCirclePlan(),
    name: "QA Account Circle",
    startDate: "2026-11-03",
  };
  let result = await request(
    "POST",
    "/api/circles",
    { id, revision: 0, status: "draft", plan },
    cookie,
  );
  assert.equal(result.status, 200, JSON.stringify(result.data));
  assert.equal(result.data.circle.revision, 1);
  result = await request("GET", "/api/circles", null, other);
  assert.equal(result.status, 200);
  assert(!result.data.circles.some((c) => c.id === id));
  result = await request(
    "POST",
    "/api/circles",
    { id, revision: 1, status: "active", plan },
    other,
  );
  assert.equal(result.status, 409);
  result = await request(
    "POST",
    "/api/circles",
    { id, revision: 1, status: "active", plan },
    cookie,
    { origin: "https://evil.example" },
  );
  assert.equal(result.status, 403);
  result = await request(
    "POST",
    "/api/circles",
    { id, revision: 1, status: "active", plan },
    cookie,
  );
  assert.equal(result.status, 200);
  assert.equal(result.data.circle.status, "active");
  assert.equal(result.data.circle.revision, 2);
  result = await request(
    "POST",
    "/api/circles",
    { id, revision: 1, status: "active", plan },
    cookie,
  );
  assert.equal(result.status, 409);
  result = await request("GET", "/api/circles", null, cookie);
  assert.equal(result.data.circles.find((c) => c.id === id).status, "active");
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } },
  );
  const read = await anon.from("journey_circle_plans").select("*");
  assert(read.error || !read.data?.length);
  const previewId = crypto.randomUUID();
  ids.push(previewId);
  plan = {
    ...plan,
    name: "QA Preview Circle",
    breaks: [{ start: "2026-11-24", end: "2026-12-01" }],
  };
  result = await request("POST", "/api/circles?" + query, {
    id: previewId,
    revision: 0,
    status: "active",
    plan,
  });
  assert.equal(result.status, 200, JSON.stringify(result.data));
  result = await request("POST", "/api/circles?" + query, {
    id: previewId,
    revision: 0,
    status: "active",
    plan,
  });
  assert.equal(result.status, 200);
  assert.equal(result.data.circle.revision, 1);
  result = await request(
    "GET",
    "/api/circles?" +
      new URLSearchParams({
        review: "heather",
        key: process.env.DYDD_REVIEW_TOKEN,
      }),
  );
  assert(!result.data.circles.some((c) => c.id === previewId));
  result = await request("GET", "/api/circles", null, cookie);
  assert(!result.data.circles.some((c) => c.id === previewId));
  result = await request("POST", "/api/circles/export?" + query, { plan });
  assert.equal(result.status, 200, JSON.stringify(result.data));
  assert.equal(result.headers.get("content-type"), "application/pdf");
  assert.equal(result.data.subarray(0, 5).toString(), "%PDF-");
  fs.writeFileSync("tmp/circle-qa-plan.pdf", result.data);
  console.log(
    "PASS account draft→creation→reload; account/preview separation; invalid token, anonymous, cross-origin and cross-owner rejection; revision conflict; idempotent creation; real PDF",
  );
} finally {
  if (ids.length)
    await admin.from("journey_circle_plans").delete().in("id", ids);
  for (const id of users) await admin.auth.admin.deleteUser(id);
}
