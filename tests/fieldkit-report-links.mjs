import fs from "node:fs";
import assert from "node:assert/strict";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
process.loadEnvFile(".env.runtime");
const base = process.env.REFLECTION_TEST_BASE ?? "http://localhost:3157";
const browser = await puppeteer.launch({
  args: chromium.args,
  executablePath: await chromium.executablePath(),
  headless: true,
});
try {
  const page = await browser.newPage();
  const response = await page.goto(
    `${base}/field-kit?${new URLSearchParams({ review: "new", key: process.env.DYDD_REVIEW_TOKEN })}`,
    { waitUntil: "networkidle2" },
  );
  assert.equal(response.status(), 200);
  const links = await page.$$eval(".fieldkit-report-row a", (es) =>
    es.map((e) => e.href),
  );
  assert(links.length > 0);
  const unique = [...new Set(links)],
    results = [];
  for (let from = 0; from < unique.length; from += 6) {
    const batch = await Promise.all(
      unique.slice(from, from + 6).map(async (url) => {
        const r = await fetch(url, { redirect: "manual" });
        const location = r.headers.get("location") ?? "";
        assert(
          [200, 307, 302].includes(r.status),
          `Report open returned ${r.status} (${new URL(url).pathname})`,
        );
        assert(
          !location.includes("/login?"),
          "Report sent review user to login",
        );
        if (r.status === 200) {
          assert.match(
            r.headers.get("content-type"),
            /text\/html|application\/pdf/,
          );
          if (r.headers.get("content-type").includes("text/html"))
            assert.match(await r.text(), /saved assessment|Preparing your PDF|original PDF unavailable/);
        }
        return {
          status: r.status,
          attachedPdf: Boolean(location),
          route: new URL(url).pathname.startsWith("/api/artifacts/")
            ? "snapshot"
            : "fruitlife-session",
        };
      }),
    );
    results.push(...batch);
  }
  assert.equal(
    (
      await fetch(
        `${base}/api/artifacts/00000000-0000-0000-0000-000000000000/download?review=new&key=invalid`,
        { redirect: "manual" },
      )
    ).status,
    404,
  );
  console.log(
    JSON.stringify({
      checked: results.length,
      savedResults: results.filter((r) => r.status === 200).length,
      pdfRedirects: results.filter((r) => r.attachedPdf).length,
      fruitlife: results.filter((r) => r.route === "fruitlife-session").length,
      allPassed: true,
    }),
  );
  // Visually inspect one older saved-result page, including narrow phone layout.
  const older = unique.find((url) => url.includes("/api/artifacts/"));
  await page.setViewport({ width: 390, height: 900 });
  const report = await page.goto(older, { waitUntil: "networkidle2" });
  assert.equal(report.status(), 200);
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "Saved-result phone overflow",
  );
  await page.screenshot({
    path: `tmp/fieldkit-report-open-${base.startsWith("https") ? "live" : "local"}-390.png`,
    fullPage: true,
  });
} finally {
  await browser.close();
}
