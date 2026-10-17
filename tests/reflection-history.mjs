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
const base = process.env.REFLECTION_TEST_BASE ?? "http://localhost:3154",
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
    "tmp/reflection-qa-active.json",
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
  const a = await makeAccount("A"),
    b = await makeAccount("B");
  accounts.push(a, b);
  for (const type of [
    "designid",
    "spiritual_gifts",
    "fruit_360",
    "designpd",
    "spiritual_gifts",
  ]) {
    const snapshot = await check(
      await admin
        .from("assessment_snapshots")
        .insert({
          user_id: a.id,
          assessment_type: type,
          source: "reflection_qa",
          scores: { Primary: "Artisan", Secondary: "Architect" },
          source_submitted_at:
            type === "spiritual_gifts"
              ? "2026-04-01T12:00:00Z"
              : "2026-10-16T12:00:00Z",
        })
        .select("id")
        .single(),
    );
    snapshots.push(snapshot.id);
  }
  const anon = await history(null, "spiritual-gifts-service");
  assert.equal(anon.signedIn, false);
  assert.deepEqual(anon.entries, []);
  await api(
    null,
    { courseSlug: "spiritual-gifts-service", action: "new-round" },
    401,
  );
  await api(
    b,
    { courseSlug: "spiritual-gifts-service", action: "new-round" },
    403,
  );
  let isolatedRound, isolatedQuestion;
  for (const exp of reflectionExperiences) {
    let data = await history(a, exp.slug);
    assert.equal(data.canStart, true, exp.slug);
    assert.equal(data.rounds.length, 0);
    const { round } = await api(
      a,
      {
        courseSlug: exp.slug,
        action: "new-round",
        assessmentSnapshotId: data.reports[0]?.id ?? null,
      },
      201,
    );
    assert.equal(round.questions.length, exp.questions.length);
    assert.equal(round.questions[0].prompt, exp.questions[0].prompt);
    const q = round.questions[0],
      answer = `First walk ${exp.title}: patience, service, and a faithful next step.`;
    const { entry } = await api(a, {
      action: "save",
      courseSlug: exp.slug,
      roundId: round.id,
      questionId: q.id,
      response: answer,
      expectedRevision: 0,
    });
    assert.equal(entry.revision, 1);
    const secondAnswer = `Second edit ${exp.title}: clearer purpose.`;
    await api(a, {
      action: "save",
      courseSlug: exp.slug,
      roundId: round.id,
      questionId: q.id,
      response: secondAnswer,
      expectedRevision: 1,
    });
    await api(
      a,
      {
        action: "save",
        courseSlug: exp.slug,
        roundId: round.id,
        questionId: q.id,
        response: "stale-tab answer",
        expectedRevision: 1,
      },
      409,
    );
    // Retried identical saves do not create spurious history.
    await api(a, {
      action: "save",
      courseSlug: exp.slug,
      roundId: round.id,
      questionId: q.id,
      response: secondAnswer,
      expectedRevision: 2,
    });
    await api(a, {
      courseSlug: exp.slug,
      action: "position",
      roundId: round.id,
      lessonSlug: q.lessonSlug,
    });
    const { round: next } = await api(
      a,
      { courseSlug: exp.slug, action: "new-round" },
      201,
    );
    assert.equal(next.last_lesson_slug, null);
    assert.notEqual(next.id, round.id);
    assert.equal(next.assessment_snapshot_id, null);
    data = await history(a, exp.slug);
    assert.equal(data.rounds.length, 2);
    assert.equal(data.entries.length, 2);
    assert.equal(data.entries.filter((e) => e.round_id === next.id).length, 0);
    await api(a, {
      action: "save",
      courseSlug: exp.slug,
      roundId: next.id,
      questionId: q.id,
      response: `New growth ${exp.title}`,
      expectedRevision: 0,
    });
    const blankQ = next.questions[1];
    await api(a, {
      action: "save",
      courseSlug: exp.slug,
      roundId: next.id,
      questionId: blankQ.id,
      response: "",
      expectedRevision: 0,
    });
    data = await history(a, exp.slug);
    assert(
      data.entries.some(
        (e) => e.round_id === round.id && e.response === answer,
      ),
    );
    assert(
      data.entries.some(
        (e) =>
          e.round_id === next.id &&
          e.question_id === blankQ.id &&
          e.response === "",
      ),
    );
    isolatedRound = next;
    isolatedQuestion = q;
    console.log(
      `PASS ${exp.title}: complete question snapshot, account save, revision history, stale-tab conflict, idempotent retry, independent retake, blank answer.`,
    );
  }
  await api(
    b,
    {
      action: "save",
      courseSlug: isolatedRound.course_slug,
      roundId: isolatedRound.id,
      questionId: isolatedQuestion.id,
      response: "forged",
      expectedRevision: 1,
    },
    404,
  );
  const hidden = await check(
    await b.client.from("reflection_rounds").select("id").eq("user_id", a.id),
  );
  assert.deepEqual(hidden, []);
  const hiddenEntries = await check(
    await b.client.from("reflection_entries").select("id").eq("user_id", a.id),
  );
  assert.deepEqual(hiddenEntries, []);
  const forged = await b.client.from("reflection_entries").insert({
    round_id: isolatedRound.id,
    user_id: b.id,
    question_id: isolatedQuestion.id,
    prompt: "forged",
    question_version: "forged",
    lesson_slug: "forged",
    lesson_title: "forged",
    response: "forged",
    revision: 99,
  });
  assert(forged.error);
  const rewritten = await a.client
    .from("reflection_entries")
    .update({ response: "erase history" })
    .eq("round_id", isolatedRound.id);
  assert(rewritten.error, "History must be append-only");
  const foreignRpc = await b.client.rpc("save_reflection_entry", {
    p_round_id: isolatedRound.id,
    p_question_id: isolatedQuestion.id,
    p_response: "forged",
    p_expected_revision: 1,
  });
  assert(foreignRpc.error);
  const unauthorized = await api(
    a,
    {
      courseSlug: "discover-your-divine-design",
      action: "new-round",
      assessmentSnapshotId: crypto.randomUUID(),
    },
    400,
  );
  assert(unauthorized.error);
  console.log(
    "PASS API and direct database isolation, forged round/report denial, append-only history, anonymous write denial.",
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
  for (const width of [1280, 768, 390, 320]) {
    await page.setViewport({ width, height: 1000 });
    await page.goto(`${base}/field-kit`, { waitUntil: "networkidle2" });
    assert.equal(
      await page.$eval(
        "#artifacts",
        (e) => e.querySelectorAll(".fieldkit-collection").length,
      ),
      5,
    );
    const titles = await page.$$eval(
      ".fieldkit-collection .trail-placard-body > h3",
      (es) => es.map((e) => e.textContent),
    );
    assert.deepEqual(titles, [
      "Discover Your Divine Design Journey",
      "DesignID",
      "Spiritual Gifts",
      "FruitLife360",
      "DesignPD",
    ]);
    assert.equal(
      await page.$$eval(
        "#collection-spiritual-gifts .fieldkit-report-history details",
        (es) => es.length,
      ),
      2,
      "All Spiritual Gifts retakes listed, not just latest",
    );
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Field Kit ${width}px overflow`,
    );
    await page.screenshot({
      path: `tmp/fieldkit-reflections-${tag}-${width}.png`,
      fullPage: true,
    });
    console.log(
      `PASS Field Kit ${width}px: five collections in Trailheads order; every report; no horizontal overflow.`,
    );
  }
  for (const exp of reflectionExperiences) {
    await page.goto(`${base}/field-kit/reflections/${exp.slug}`, {
      waitUntil: "networkidle2",
    });
    await page.waitForFunction(
      () =>
        !document
          .querySelector(".reflection-round-bar")
          ?.textContent.includes("Loading your reflection history"),
    );
    assert.equal(
      await page.$$eval(".reflection-workbook-question", (es) => es.length),
      exp.questions.length,
      exp.slug,
    );
    assert.match(
      await page.$eval(".reflection-answer", (e) => e.textContent),
      new RegExp(`New growth ${exp.title}`),
    );
    assert.equal(
      await page.$(".reflection-answer textarea"),
      null,
      "Workbook opens as a readable record, not a wall of input boxes",
    );
    await page.click(".reflection-workbook-toolbar button");
    assert.equal(await page.$$eval("textarea:disabled", (es) => es.length), 0);
    const historical = await page.$(".reflection-history");
    assert(historical);
    await historical.click();
    assert.match(
      await page.$eval(".reflection-history", (e) => e.textContent),
      /Second edit/,
    );
    // Save from the workbook, then read the identical record from the course player.
    const answer = await page.$(".reflection-answer textarea");
    await answer.focus();
    await page.keyboard.down("Control");
    await page.keyboard.press("a");
    await page.keyboard.up("Control");
    await page.keyboard.press("Backspace");
    await answer.type(`Browser reflection ${exp.title}`);
    await page.click(".reflection-answer-actions button");
    await page.waitForFunction(() =>
      document
        .querySelector(".reflection-answer-actions")
        ?.textContent.includes("Saved to your account"),
    );
    await page.reload({ waitUntil: "networkidle2" });
    await page.waitForFunction(() =>
      document
        .querySelector(".reflection-answer .reflection-read-answer")
        ?.textContent.trimStart()
        .startsWith("Browser reflection"),
    );
    const current = await history(a, exp.slug),
      round = current.rounds[0];
    assert(
      current.entries.some(
        (e) =>
          e.round_id === round.id &&
          e.response === `Browser reflection ${exp.title}`,
      ),
    );
    const resumeQuestion = exp.questions.find(
      (q) => q.lessonSlug !== exp.questions[0].lessonSlug,
    );
    await api(a, {
      courseSlug: exp.slug,
      action: "position",
      roundId: round.id,
      lessonSlug: resumeQuestion.lessonSlug,
    });
    assert.equal(
      (await history(a, exp.slug)).rounds[0].last_lesson_slug,
      resumeQuestion.lessonSlug,
    );
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${base}${exp.href}`, { waitUntil: "networkidle2" });
    await page.waitForFunction(
      (title) =>
        document.querySelector(".journey-active-lesson > header h2")
          ?.textContent === title,
      {},
      resumeQuestion.lessonTitle,
    );
    await page.goto(
      `${base}${exp.href}?lesson=${encodeURIComponent(exp.questions[0].lessonSlug)}`,
      { waitUntil: "networkidle2" },
    );
    assert(page.url().includes(exp.href), `Course opens for ${exp.title}`);
    await page.waitForFunction(() =>
      [...document.querySelectorAll(".reflection-answer textarea")].some((e) =>
        e.value.startsWith("Browser reflection"),
      ),
    );
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Course ${exp.title} mobile overflow`,
    );
    console.log(
      `PASS ${exp.title}: complete workbook, dated previous reflections, browser save + reload, same record in actual course.`,
    );
  }
  // Previous rounds are readable and cannot be accidentally overwritten.
  await page.goto(`${base}/field-kit/reflections/spiritual-gifts-service`, {
    waitUntil: "networkidle2",
  });
  await page.waitForSelector(".reflection-round-controls select");
  const firstSelector = await page.$(".reflection-round-controls select");
  const options = await firstSelector.$$eval("option", (es) =>
    es.map((e) => e.value),
  );
  await firstSelector.select(options[1]);
  assert.equal(await page.$(".reflection-answer textarea"), null);
  assert.match(
    await page.$eval(".reflection-answer", (e) => e.textContent),
    /Second edit/,
  );
  await firstSelector.select(options[0]);
  await page.click(".reflection-workbook-toolbar button");
  // Offline/save errors retain the draft and show a retryable error.
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (
      request.url().includes("/api/course-reflections") &&
      request.method() === "POST"
    )
      request.respond({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Save temporarily unavailable; your draft is still here.",
        }),
      });
    else request.continue();
  });
  const draft = await page.$(".reflection-answer textarea");
  await draft.focus();
  await page.keyboard.down("Control");
  await page.keyboard.press("a");
  await page.keyboard.up("Control");
  await page.keyboard.press("Backspace");
  await draft.type("Draft retained during failed save");
  await page.click(".reflection-answer-actions button");
  await page.waitForFunction(() =>
    document
      .querySelector(".reflection-answer-actions")
      ?.textContent.includes("temporarily unavailable"),
  );
  assert.equal(
    await page.$eval(".reflection-answer textarea", (e) => e.value),
    "Draft retained during failed save",
  );
  await page.setRequestInterception(false);
  page.removeAllListeners("request");
  // Cancel the unsaved-change prompt and verify the editor stays intact.
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.click(".course-nav a");
  assert(page.url().includes("/field-kit/reflections/"));
  assert.equal(
    await page.$eval(".reflection-answer textarea", (e) => e.value),
    "Draft retained during failed save",
  );
  // Deliberately leave QA draft; no real user data is touched.
  page.once("dialog", (dialog) => dialog.accept());
  const journey = reflectionExperiences[0],
    niche = journey.questions.find((q) => q.id === "niche-working-declaration");
  await page.goto(
    `${base}/journey?lesson=${encodeURIComponent(niche.lessonSlug)}`,
    { waitUntil: "networkidle2" },
  );
  await page.waitForSelector(".journey-niche-builder button");
  await page.click(".journey-niche-builder > button");
  await page.waitForSelector("dialog[open]");
  await page.select("dialog label select", "spiritual-gifts-service");
  await page.waitForFunction(() =>
    document
      .querySelector("dialog")
      ?.textContent.includes("Browser reflection Spiritual Gifts"),
  );
  await page.click("dialog article button");
  await page.click("dialog header button");
  assert.equal(await page.$("dialog[open]"), null);
  assert.match(
    await page.$eval(".journey-niche-builder textarea", (e) => e.value),
    /Browser reflection Spiritual Gifts/,
  );
  assert.match(
    await page.$eval(".journey-niche-builder textarea", (e) => e.value),
    /\[Spiritual Gifts/,
  );
  await page.click(".journey-niche-builder .reflection-answer-actions button");
  await page.waitForFunction(() =>
    document
      .querySelector(".journey-niche-builder")
      ?.textContent.includes("Saved to your account"),
  );
  await page.reload({ waitUntil: "networkidle2" });
  await page.waitForFunction(() =>
    document
      .querySelector(".journey-niche-builder textarea")
      ?.value.includes("[Spiritual Gifts"),
  );
  await page.goto(`${base}/field-kit/reflections/discover-your-divine-design`, {
    waitUntil: "networkidle2",
  });
  await page.waitForSelector(
    '#reflection-niche-working-declaration a[href*="round="]',
  );
  const sourceLink = await page.$eval(
    '#reflection-niche-working-declaration a[href*="round="]',
    (e) => e.getAttribute("href"),
  );
  assert(
    sourceLink.startsWith(
      "/field-kit/reflections/spiritual-gifts-service?round=",
    ),
  );
  await page.goto(`${base}${sourceLink}`, { waitUntil: "networkidle2" });
  await page.waitForFunction(
    () =>
      document.querySelector(".reflection-round-controls select")?.value ===
      new URLSearchParams(location.search).get("round"),
  );
  assert.match(
    await page.$eval(".reflection-answer", (e) => e.textContent),
    /Browser reflection Spiritual Gifts/,
  );
  console.log(
    "PASS niche insight links reopen the exact owned, dated source reflection.",
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS historical read-only rounds, failed-save draft retention, unsaved navigation guard, niche Field Kit side panel, attributed insights, saved niche draft and reload, no browser errors.",
  );
} catch (error) {
  if (browser) {
    const pages = await browser.pages();
    const page = pages.at(-1);
    if (page) {
      await page
        .screenshot({
          path: `tmp/reflection-failure-${tag}.png`,
          fullPage: false,
        })
        .catch(() => {});
      const state = await page
        .evaluate(() => ({
          url: location.pathname,
          text: document.querySelector("main")?.textContent?.slice(0, 2200),
          first: document.querySelector(".reflection-answer")?.textContent,
          value: document.querySelector(".reflection-answer textarea")?.value,
        }))
        .catch(() => ({}));
      fs.writeFileSync(
        `tmp/reflection-failure-${tag}.json`,
        JSON.stringify(state),
      );
    }
  }
  throw error;
} finally {
  if (browser) await browser.close();
  for (const id of ids) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) throw Error(`QA cleanup failed: ${error.message}`);
  }
  const leftovers = await check(
    await admin.from("reflection_rounds").select("id").in("user_id", ids),
  );
  assert.deepEqual(leftovers, []);
  const snapshotLeftovers = await check(
    await admin.from("assessment_snapshots").select("id").in("id", snapshots),
  );
  assert.deepEqual(snapshotLeftovers, []);
  fs.writeFileSync(
    "tmp/reflection-qa-active.json",
    JSON.stringify({ ids: [], base, cleaned: true }),
  );
  console.log(
    "PASS all exact QA accounts, reports, rounds, and answers removed. Existing learner data untouched.",
  );
}
