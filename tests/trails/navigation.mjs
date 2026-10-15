import fs from "node:fs";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
const base = process.env.TRAIL_TEST_BASE ?? "http://localhost:3154";
const tag = base.startsWith("https") ? "live" : "local";
const c = JSON.parse(
  fs.readFileSync(
    "/home/openclaw/.openclaw/secrets/dydd-online-school-supabase.json",
  ),
);
const s = createClient(c.project_url, c.service_role_key, {
  auth: { persistSession: false },
});
const browser = await puppeteer.launch({
  args: chromium.args,
  executablePath: await chromium.executablePath(),
  headless: true,
});
const errors = [];
try {
  const page = await browser.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  // Direct course and standalone lesson entry must not bypass prerequisites.
  for (const path of [
    "/courses/designid-foundations",
    "/learn/designid-foundations/welcome-to-designid",
    "/courses/spiritual-gifts-service",
    "/courses/fruitlife-360-formation",
    "/courses/designpd-alignment",
    "/learn/designpd-alignment/welcome-to-designpd",
    "/learn/spiritual-gifts-service/welcome-to-spiritual-gifts",
    "/learn/fruitlife-360-formation/welcome-to-fruitlife-360",
  ]) {
    const response = await fetch(`${base}${path}`, { redirect: "manual" });
    assert.equal(response.status, 307, `${path} anonymous guard`);
    assert.match(response.headers.get("location"), /login/);
  }
  await page.goto(`${base}/trailheads`, { waitUntil: "networkidle2" });
  const anonText = await page.$eval("main", (el) => el.innerText);
  assert(!anonText.includes("Included with subscription"));
  assert.equal(await page.$$eval(".trail-guide-route", (es) => es.length), 4);
  assert.equal(
    await page.$eval("#designid .trail-guide-route-actions a", (e) =>
      e.getAttribute("href"),
    ),
    "/designid",
  );
  assert.equal(
    await page.$eval("#designpd .trail-guide-route-actions a", (e) =>
      e.getAttribute("href"),
    ),
    "/designid",
  );
  for (const width of [1280, 768, 390]) {
    await page.setViewport({ width, height: 1000 });
    await page.goto(`${base}/trailheads`, { waitUntil: "networkidle2" });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Trailheads ${width} overflow`,
    );
    assert(
      await page.$$eval(".trail-placard", (es) =>
        es.every((e) => e.getBoundingClientRect().width > 220),
      ),
    );
    await page.$$eval(".trail-guide-route-art img", (es) =>
      es.forEach((e) => (e.loading = "eager")),
    );
    await page.waitForFunction(() =>
      [
        ...document.querySelectorAll(
          ".trail-guide-route-art img,.trail-showcase-art img,.trail-dydd-logo",
        ),
      ].every((e) => e.complete && e.naturalWidth > 0),
    );
    await page.screenshot({
      path: `tmp/trails-${tag}-${width}.png`,
      fullPage: true,
    });
    await (
      await page.$("#designid")
    ).screenshot({ path: `tmp/trails-placard-${tag}-${width}.png` });
    console.log(
      `PASS ${width}px new-user Trailheads: correct next steps, all artwork loaded, no overflow.`,
    );
  }
  const { data: users, error: usersError } = await s.auth.admin.listUsers({
    perPage: 1000,
  });
  if (usersError) throw Error("Existing-user lookup failed");
  const existing = users.users.find(
    (u) => u.email === "john@discoverdivine.design",
  );
  assert(existing, "Existing verification account required; do not create one");
  const { data, error } = await s.auth.admin.generateLink({
    type: "magiclink",
    email: existing.email,
  });
  if (error) throw Error("Verification sign-in failed");
  const confirmed = await fetch(`${base}/auth/confirm`, {
    method: "POST",
    body: new URLSearchParams({
      token_hash: data.properties.hashed_token,
      next: "/trailheads",
    }),
    redirect: "manual",
  });
  assert.equal(confirmed.status, 307);
  const cookies = confirmed.headers.getSetCookie().map((x) => {
    const pair = x.split(";")[0],
      at = pair.indexOf("=");
    return { name: pair.slice(0, at), value: pair.slice(at + 1), url: base };
  });
  await browser.setCookie(...cookies);
  for (const width of [1280, 390]) {
    await page.setViewport({ width, height: 1000 });
    await page.goto(`${base}/field-kit`, { waitUntil: "networkidle2" });
    assert.equal(await page.$(".fieldkit-assessment-card"), null);
    assert.equal(await page.$("#subscription-assessments"), null);
    assert.equal(await page.$("#optional-expansions"), null);
    assert(await page.$("#artifacts"));
    assert.match(await page.$eval("main", (e) => e.innerText), /Trailheads/);
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Field Kit ${width} overflow`,
    );
    await page.screenshot({
      path: `tmp/fieldkit-unified-${tag}-${width}.png`,
      fullPage: true,
    });
  }
  await page.goto(`${base}/trailheads`, { waitUntil: "networkidle2" });
  const readyLinks = await page.$$eval(
    ".trail-guide-route-actions a.primary",
    (es) =>
      es
        .map((e) => e.getAttribute("href"))
        .filter((h) => h.startsWith("/courses/")),
  );
  for (const href of readyLinks) {
    await page.goto(`${base}${href}`, { waitUntil: "networkidle2" });
    assert(
      page.url().includes("/courses/"),
      "Ready trail must open its course",
    );
    const firstTitle = await page.$eval(
      ".journey-active-lesson > header h2",
      (e) => e.innerText,
    );
    await page.$$eval(".journey-active-pagination button", (buttons) =>
      buttons.find((button) => button.innerText.startsWith("Next:"))?.click(),
    );
    await page.waitForFunction(
      (title) =>
        document.querySelector(".journey-active-lesson > header h2")
          ?.innerText !== title,
      {},
      firstTitle,
    );
    const nextTitle = await page.$eval(
      ".journey-active-lesson > header h2",
      (e) => e.innerText,
    );
    await page.reload({ waitUntil: "networkidle2" });
    await page.waitForFunction(
      (title) =>
        document.querySelector(".journey-active-lesson > header h2")
          ?.innerText === title,
      {},
      nextTitle,
    );
  }

  // Completed-report review uses the existing signed preview, never creates learner data.
  if (process.env.DYDD_REVIEW_TOKEN) {
    const reviewQuery = `?review=new&key=${encodeURIComponent(process.env.DYDD_REVIEW_TOKEN)}`;
    await page.goto(`${base}/trailheads${reviewQuery}`, {
      waitUntil: "networkidle2",
    });
    const completedLinks = await page.$$eval(
      ".trail-guide-route-actions a.primary",
      (es) =>
        es
          .map((e) => e.getAttribute("href"))
          .filter((h) => h.startsWith("/courses/")),
    );
    assert(
      completedLinks.length >= 2,
      "Existing preview must exercise completed assessment states",
    );
    for (const href of completedLinks) {
      await page.goto(`${base}${href}`, { waitUntil: "networkidle2" });
      assert(
        page.url().includes("/courses/"),
        "Completed trail must open its course",
      );
    }
    await page.goto(`${base}/trailheads${reviewQuery}`, {
      waitUntil: "networkidle2",
    });
    assert.match(
      await page.$eval(
        "#designid .trail-guide-route-actions .button.primary",
        (e) => e.innerText,
      ),
      /Continue/,
    );
    console.log(
      `PASS ${completedLinks.length} completed preview course routes and resume labels.`,
    );
  }
  // Choose a later Journey lesson, open connected trail, and verify its return position.
  await page.goto(`${base}/journey`, { waitUntil: "networkidle2" });
  await page.evaluate(() =>
    localStorage.setItem(
      "dydd-journey-position",
      "identity-the-designid-lens-what-is-in-the-report-19",
    ),
  );
  await page.reload({ waitUntil: "networkidle2" });
  assert.match(
    await page.$eval(".journey-active-lesson > header h2", (e) => e.innerText),
    /DesignID/i,
  );
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2" }),
    page.click(".journey-active-body .trail-fieldkit-note a"),
  ]);
  await page.waitForSelector("#designid");
  assert(page.url().includes("from=journey"));
  assert(await page.$(".trail-return-note"));
  await page.evaluate(
    () => (document.documentElement.style.scrollBehavior = "auto"),
  );
  await page.waitForSelector(".trail-return-note a", { visible: true });
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2" }),
    page.click(".trail-return-note a"),
  ]);
  await page.waitForSelector(".journey-active-lesson > header");
  await page.waitForFunction(() =>
    document
      .querySelector(".journey-active-lesson > header h2")
      ?.innerText.includes("DesignID"),
  );
  // Course resume key updates the trail button and reopens the saved lesson.
  await page.goto(`${base}/trailheads`, { waitUntil: "networkidle2" });
  assert.match(
    await page.$eval(".trail-showcase .button.primary", (e) => e.innerText),
    /Continue/,
  );
  await page.goto(`${base}/trailheads?lane=fruitlife`, {
    waitUntil: "networkidle2",
  });
  assert.equal(await page.$$eval(".trail-guide-route", (es) => es.length), 2);
  assert.equal(await page.$(".trail-showcase"), null);
  await page.goto(`${base}/field-kit?lane=fruitlife`, {
    waitUntil: "networkidle2",
  });
  assert.equal(await page.$(".fieldkit-assessment-card"), null);
  assert(await page.$("#artifacts"));
  await page.goto(`${base}/field-kit#optional-expansions`, {
    waitUntil: "networkidle2",
  });
  await page.waitForFunction(
    () => location.pathname === "/trailheads" && location.hash === "#designpd",
  );
  assert.deepEqual(errors, []);
  console.log(
    `PASS Field Kit artifact-only layout, ${readyLinks.length} account-ready course routes, Journey→Trailhead→saved lesson round trip, continued Journey label, mini lane, no browser errors. No assessments submitted or emails sent.`,
  );
} finally {
  await browser.close();
}
