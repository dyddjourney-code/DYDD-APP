import fs from "node:fs";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url),
  load = require("../scripts/fruitlife-test-load.cjs");
const { reflectionExperiences } = load("lib/reflections/catalog.ts");
const cfg = JSON.parse(
  fs.readFileSync(
    "/home/openclaw/.openclaw/secrets/dydd-online-school-supabase.json",
  ),
);
const admin = createClient(cfg.project_url, cfg.service_role_key, {
  auth: { persistSession: false },
});
const base = process.env.REFLECTION_TEST_BASE ?? "http://localhost:3157",
  tag = base.startsWith("https") ? "live" : "local";
const ids = [],
  snapshots = [],
  accounts = [];
let browser;
async function check(result) {
  if (result.error) throw Error(result.error.message);
  return result.data;
}
async function makeAccount(lane) {
  const email = `reflection-qa-${crypto.randomUUID()}@example.invalid`,
    password = crypto.randomBytes(24).toString("base64url");
  const { user } = await check(
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: `Reflection verification ${lane}` },
    }),
  );
  ids.push(user.id);
  fs.writeFileSync(
    "tmp/reflection-portable-qa-active.json",
    JSON.stringify({ ids, base }),
  );
  const client = createClient(cfg.project_url, cfg.anon_key, {
    auth: { persistSession: false },
  });
  await check(await client.auth.signInWithPassword({ email, password }));
  const link = await check(
    await admin.auth.admin.generateLink({ type: "magiclink", email }),
  );
  const r = await fetch(`${base}/auth/confirm`, {
    method: "POST",
    body: new URLSearchParams({
      token_hash: link.properties.hashed_token,
      next: "/field-kit",
    }),
    redirect: "manual",
  });
  assert.equal(r.status, 307);
  const cookies = r.headers.getSetCookie().map((x) => {
    const pair = x.split(";")[0],
      i = pair.indexOf("=");
    return { name: pair.slice(0, i), value: pair.slice(i + 1), url: base };
  });
  assert(cookies.length);
  return {
    id: user.id,
    email,
    client,
    cookies,
    cookie: cookies.map((c) => `${c.name}=${c.value}`).join("; "),
  };
}
async function api(account, body, expected = 200) {
  const r = await fetch(`${base}/api/course-reflections`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(account ? { Cookie: account.cookie } : {}),
    },
    body: JSON.stringify(body),
  });
  const b = await r.json();
  assert.equal(r.status, expected, JSON.stringify(b));
  return b;
}
async function history(account, slug) {
  const r = await fetch(`${base}/api/course-reflections?courseSlug=${slug}`, {
    headers: account ? { Cookie: account.cookie } : {},
  });
  assert.equal(r.status, 200);
  return r.json();
}
try {
  const a = await makeAccount("portable-A"),
    b = await makeAccount("portable-B");
  for (const type of ["designid", "spiritual_gifts", "fruit_360", "designpd"]) {
    const snap = await check(
      await admin
        .from("assessment_snapshots")
        .insert({
          user_id: a.id,
          assessment_type: type,
          source: "reflection_portable_qa",
          scores: { Primary: "Architect" },
          source_submitted_at: "2026-10-16T12:00:00Z",
        })
        .select("id")
        .single(),
    );
    snapshots.push(snap.id);
  }
  const getExport = async (account, query, expected = 200) => {
    const r = await fetch(`${base}/api/course-reflections/export?${query}`, {
      headers: account ? { Cookie: account.cookie } : {},
    });
    assert.equal(r.status, expected);
    return r;
  };
  const slug = "spiritual-gifts-service";
  let current;
  for (const exp of reflectionExperiences) {
    const { round } = await api(
      a,
      { action: "new-round", courseSlug: exp.slug },
      201,
    );
    await api(a, {
      action: "save",
      courseSlug: exp.slug,
      roundId: round.id,
      questionId: round.questions[0].id,
      response: `Saved portable ${exp.title}`,
      expectedRevision: 0,
    });
    const r = await getExport(
      a,
      new URLSearchParams({
        scope: "round",
        courseSlug: exp.slug,
        round: round.id,
      }),
    );
    assert.match(
      r.headers.get("Content-Disposition"),
      /attachment; filename=".*\.txt"/,
    );
    const text = await r.text();
    assert(text.includes(`Saved portable ${exp.title}`));
    assert(text.includes(round.questions.at(-1).prompt));
    assert(text.includes("[Not answered in this walkthrough]"));
    if (exp.slug === slug) current = round;
  }
  let exported = await (await getExport(a, "scope=all")).text();
  for (const exp of reflectionExperiences)
    assert(exported.includes(`Saved portable ${exp.title}`));
  await getExport(null, "scope=all", 401);
  await getExport(
    b,
    new URLSearchParams({
      scope: "round",
      courseSlug: slug,
      round: current.id,
    }),
    404,
  );
  const { round: manual } = await api(
    a,
    { action: "new-round", courseSlug: slug },
    201,
  );
  await api(
    a,
    {
      action: "save",
      courseSlug: slug,
      roundId: current.id,
      questionId: current.questions[0].id,
      response: "forbidden overwrite",
      expectedRevision: 1,
    },
    403,
  );
  const direct = await a.client.rpc("save_reflection_entry", {
    p_round_id: current.id,
    p_question_id: current.questions[0].id,
    p_response: "direct forbidden",
    p_expected_revision: 1,
  });
  assert.equal(direct.error?.code, "PT403");
  const directInsert = await a.client
    .from("reflection_entries")
    .insert({
      round_id: current.id,
      user_id: a.id,
      question_id: current.questions[0].id,
      prompt: current.questions[0].prompt,
      question_version: "v",
      lesson_slug: current.questions[0].lessonSlug,
      lesson_title: "Lesson",
      response: "bypass forbidden",
      revision: 2,
    });
  assert(directInsert.error);
  // Move only the temporary test round back to make assessment completion unambiguously later.
  await check(
    await admin
      .from("reflection_rounds")
      .update({ started_at: new Date(Date.now() - 15000).toISOString() })
      .eq("id", manual.id)
      .eq("user_id", a.id),
  );
  const snap = await check(
    await admin
      .from("assessment_snapshots")
      .insert({
        user_id: a.id,
        assessment_type: "spiritual_gifts",
        source: "reflection_portable_qa",
        scores: { Primary: "Architect" },
        source_submitted_at: new Date().toISOString(),
      })
      .select("id")
      .single(),
  );
  snapshots.push(snap.id);
  let data = await history(a, slug);
  assert.equal(data.nextAssessmentReportId, snap.id);
  const synced = await Promise.all(
    [0, 1, 2].map(() => api(a, { action: "sync-round", courseSlug: slug })),
  );
  assert.equal(
    new Set(synced.map((x) => x.round.id)).size,
    1,
    "Concurrent opens create exactly one new round",
  );
  data = await history(a, slug);
  assert.equal(data.rounds.length, 3);
  assert.equal(data.rounds[0].assessment_snapshot_id, snap.id);
  assert.equal(data.nextAssessmentReportId, null);
  assert(
    data.entries.some(
      (e) =>
        e.round_id === current.id &&
        e.response === "Saved portable Spiritual Gifts",
    ),
  );
  await api(b, { action: "sync-round", courseSlug: slug }, 403);
  const artifact = await fetch(`${base}/api/artifacts/${snap.id}/download`, {
    headers: { Cookie: a.cookie },
    redirect: "manual",
  });
  assert.equal(artifact.status, 200);
  assert((await artifact.text()).includes("not a substitute report"));
  assert.equal(
    (
      await fetch(`${base}/api/artifacts/${snap.id}/download`, {
        headers: { Cookie: b.cookie },
        redirect: "manual",
      })
    ).status,
    404,
  );
  assert.equal(
    (
      await fetch(`${base}/api/artifacts/${snap.id}/download`, {
        redirect: "manual",
      })
    ).status,
    404,
  );
  await check(
    await admin
      .from("assessment_snapshots")
      .update({
        scores: {
          pdfMonkey: {
            providerUrl: "https://example.invalid/saved-report.pdf",
          },
        },
      })
      .eq("id", snap.id)
      .eq("user_id", a.id),
  );
  const pdf = await fetch(`${base}/api/artifacts/${snap.id}/download`, {
    headers: { Cookie: a.cookie },
    redirect: "manual",
  });
  assert.equal(pdf.status, 200);
  assert((await pdf.text()).includes("not a substitute report"));
  assert.equal(pdf.headers.get("location"), null, "An unverified provider URL must not masquerade as a working PDF");
  console.log(
    "PASS all-five-workbook text exports, selected/all dated scopes, blank questions, anonymous/foreign denial, archive API/RPC/direct-insert denial, atomic assessment rollover, saved-answer preservation and report opening.",
  );
  browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });
  await browser.setCookie(...a.cookies);
  const page = await browser.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${base}/field-kit/reflections/${slug}`, {
    waitUntil: "networkidle2",
  });
  await page.waitForSelector(".reflection-export-controls");
  await page.click(".reflection-module > summary");
  await page.click(".reflection-module .reflection-lesson > summary");
  await page.click(".reflection-answer button");
  await page.waitForSelector(".reflection-answer textarea");
  await page.type(
    ".reflection-answer textarea",
    "Edited from the readable workbook",
  );
  await page.click(".reflection-review-edit-bar button");
  await page.waitForFunction(() =>
    document
      .querySelector(".reflection-answer-actions")
      ?.textContent.includes("Saved to your account"),
  );
  await page.reload({ waitUntil: "networkidle2" });
  await page.click(".reflection-module > summary");
  await page.click(".reflection-module .reflection-lesson > summary");
  assert(
    (await page.$eval(".reflection-answer", (e) => e.textContent)).includes(
      "Edited from the readable workbook",
    ),
  );
  const downloadDir = fs.realpathSync("tmp");
  await browser.defaultBrowserContext().overridePermissions(base, []);
  const cdp = await page.createCDPSession();
  await cdp.send("Browser.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: downloadDir,
  });
  await page.click(".reflection-export-actions button:first-child");
  await page.waitForFunction(() =>
    document
      .querySelector(".reflection-export-controls")
      ?.textContent.includes("Text file downloaded"),
  );
  const downloadName = `dydd-reflections-${slug}-${new Date().toISOString().slice(0, 10)}.txt`;
  assert(
    fs
      .readFileSync(`tmp/${downloadName}`, "utf8")
      .includes("Edited from the readable workbook"),
  );
  for (const width of [1280, 768, 390, 320]) {
    await page.setViewport({ width, height: 1000 });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Portable controls overflow ${width}`,
    );
    if (width === 390)
      await page.screenshot({
        path: `tmp/reflection-portable-${tag}-390.png`,
        fullPage: true,
      });
  }
  await page.select(
    ".reflection-round-controls label:first-child select",
    current.id,
  );
  assert.equal(await page.$(".reflection-workbook-toolbar button"), null);
  assert.equal(await page.$(".reflection-answer textarea"), null);
  assert.equal(await page.$(".reflection-answer button"), null);
  await page.select(".reflection-export-controls select", "course");
  const allRounds = await (
    await getExport(
      a,
      new URLSearchParams({ scope: "course", courseSlug: slug }),
    )
  ).text();
  assert(allRounds.includes("Saved portable Spiritual Gifts"));
  assert(allRounds.includes("Edited from the readable workbook"));
  // Fresh assessment completion is picked up automatically when opening the workbook.
  const last = data.rounds[0];
  await check(
    await admin
      .from("reflection_rounds")
      .update({ started_at: new Date(Date.now() - 5000).toISOString() })
      .eq("id", last.id)
      .eq("user_id", a.id),
  );
  const newest = await check(
    await admin
      .from("assessment_snapshots")
      .insert({
        user_id: a.id,
        assessment_type: "spiritual_gifts",
        source: "reflection_portable_qa",
        scores: { Primary: "Architect" },
        source_submitted_at: new Date().toISOString(),
      })
      .select("id")
      .single(),
  );
  snapshots.push(newest.id);
  await page.goto(`${base}/field-kit/reflections/${slug}`, {
    waitUntil: "networkidle2",
  });
  await page.waitForFunction(
    () =>
      document.querySelector(".reflection-workbook-toolbar button")
        ?.textContent === "Edit my reflections",
  );
  data = await history(a, slug);
  assert.equal(data.rounds[0].assessment_snapshot_id, newest.id);
  assert.equal(data.rounds.length, 4);
  assert.deepEqual(errors, []);
  console.log(
    "PASS browser individual edit/save-all/reload, actual TXT download, all dated history, archived read-only UI, automatic new-assessment walkthrough and four responsive widths.",
  );
} finally {
  if (browser) await browser.close();
  for (const id of ids) await check(await admin.auth.admin.deleteUser(id));
  const leftover = await check(
    await admin.from("reflection_rounds").select("id").in("user_id", ids),
  );
  assert.deepEqual(leftover, []);
  const leftoverSnapshots = await check(
    await admin.from("assessment_snapshots").select("id").in("id", snapshots),
  );
  assert.deepEqual(leftoverSnapshots, []);
  fs.writeFileSync(
    "tmp/reflection-portable-qa-active.json",
    JSON.stringify({ ids: [], cleaned: true, base }),
  );
  console.log("PASS portable QA exact accounts and records removed.");
}
