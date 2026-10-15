import assert from "node:assert/strict";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
const base = process.env.TRAIL_TEST_BASE ?? "http://localhost:3154";
let key = process.env.DYDD_REVIEW_TOKEN;
if (!key) {
  const response = await fetch(`${base}/field-kit`, { redirect: "manual" });
  const location = response.headers.get("location");
  if (location) key = new URL(location, base).searchParams.get("key");
}
assert(
  key,
  "Existing preview context required for this read-only navigation check",
);
const query = `?review=new&key=${encodeURIComponent(key)}`;
const browser = await puppeteer.launch({
  args: chromium.args,
  executablePath: await chromium.executablePath(),
  headless: true,
});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewport({ width: 1280, height: 1000 });
  const check = (href, path, hash = "") => {
    const url = new URL(href, base);
    assert.equal(url.pathname, path);
    assert.equal(url.hash, hash);
    assert.equal(url.searchParams.get("review"), "new");
    assert(
      url.searchParams.get("key") === key,
      "Selected preview context must be preserved",
    );
  };
  const click = async (selector) => {
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2" }),
      page.click(selector),
    ]);
  };
  await page.goto(`${base}/ranger-station${query}`, {
    waitUntil: "networkidle2",
  });
  await page.click("#ranger-question-2");
  check(
    await page.$eval(".ranger-faq-answer a", (e) => e.getAttribute("href")),
    "/trailheads",
    "#designid",
  );
  await click(".ranger-faq-answer a");
  await page.waitForSelector("#designid .trail-guide-route-actions a.primary");
  check(page.url(), "/trailheads", "#designid");
  check(
    await page.$eval("#designid .trail-guide-route-actions a.primary", (e) =>
      e.getAttribute("href"),
    ),
    "/courses/designid-foundations",
  );
  check(
    await page.$eval(".trail-showcase a.primary", (e) =>
      e.getAttribute("href"),
    ),
    "/journey",
  );
  await click("#designid .trail-guide-route-actions a.primary");
  await page.waitForSelector(".course-nav a[href*=\"/journey\"]");
  check(page.url(), "/courses/designid-foundations");
  const returnSelector = '.course-nav a[href*="/journey"]';
  check(
    await page.$eval(returnSelector, (e) => e.getAttribute("href")),
    "/journey",
  );
  await click(returnSelector);
  await page.waitForSelector("header.journey-hero");
  await page.evaluate(() =>
    localStorage.setItem(
      "dydd-journey-position",
      "identity-the-designid-lens-what-is-in-the-report-19",
    ),
  );
  await page.reload({ waitUntil: "networkidle2" });
  await page.waitForFunction(() =>
    document
      .querySelector(".journey-active-lesson > header h2")
      ?.innerText.includes("DesignID"),
  );
  const bridge = ".journey-active-body .trail-fieldkit-note a";
  check(
    await page.$eval(bridge, (e) => e.getAttribute("href")),
    "/trailheads",
    "#designid",
  );
  await click(bridge);
  await page.waitForSelector(".trail-return-note a");
  assert.equal(new URL(page.url()).searchParams.get("from"), "journey");
  check(
    await page.$eval(".trail-return-note a", (e) => e.getAttribute("href")),
    "/journey",
  );
  await page.evaluate(
    () => (document.documentElement.style.scrollBehavior = "auto"),
  );
  await click(".trail-return-note a");
  await page.waitForFunction(() =>
    document
      .querySelector(".journey-active-lesson > header h2")
      ?.innerText.includes("DesignID"),
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS selected Jordan preview through Ranger Desk → Trailhead → DesignID course → Journey → connected trail → same Journey lesson; query/fragment context preserved, no browser errors. No account sign-ins, learner submissions or emails.",
  );
} finally {
  await browser.close();
}
