import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const baseUrl = process.env.PERFORMANCE_BASE_URL ?? "http://127.0.0.1:3000";
const outputDirectory = path.resolve("performance-results");
const trials = Number(process.env.PERFORMANCE_TRIALS ?? "3");
const routes = [
  { id: "home", pathname: "/", indexable: true },
  { id: "pricing", pathname: "/pricing", indexable: true },
  { id: "article", pathname: "/blog/gpt-vs-claude-vs-gemini", indexable: true },
  { id: "login", pathname: "/login", indexable: false },
];
const profiles = ["mobile", "desktop"];
const budgets = { performance: 90, otherCategory: 95, lcp: 2500, cls: 0.1, tbt: 200 };

if (!Number.isInteger(trials) || trials < 1 || trials > 10) {
  throw new Error("PERFORMANCE_TRIALS must be an integer from 1 to 10.");
}
const parsedBase = new URL(baseUrl);
if (!['http:', 'https:'].includes(parsedBase.protocol) || parsedBase.username || parsedBase.password) {
  throw new Error("PERFORMANCE_BASE_URL must be an HTTP(S) URL without embedded credentials.");
}
await mkdir(outputDirectory, { recursive: true });

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function rounded(value, digits = 1) {
  return Number(value.toFixed(digits));
}

function summarize(values, digits = 1) {
  return { median: rounded(median(values), digits), min: rounded(Math.min(...values), digits), max: rounded(Math.max(...values), digits) };
}

const environment = {
  startedAt: new Date().toISOString(),
  baseUrl,
  node: process.version,
  platform: `${process.platform}/${process.arch}`,
  revision: process.env.GITHUB_SHA ?? (await execFileAsync("git", ["rev-parse", "HEAD"])).stdout.trim(),
  trialsPerRouteProfile: trials,
  budgets,
};
const runs = [];

for (const route of routes) {
  for (const profile of profiles) {
    for (let trial = 1; trial <= trials; trial += 1) {
      const id = `${route.id}-${profile}-${trial}`;
      const outputBase = path.join(outputDirectory, id);
      const url = new URL(route.pathname, baseUrl).href;
      const args = [
        url,
        "--quiet",
        "--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage",
        "--only-categories=performance,accessibility,best-practices,seo",
        "--throttling-method=simulate",
        "--max-wait-for-load=45000",
        "--output=json",
        "--output=html",
        `--output-path=${outputBase}`,
      ];
      if (profile === "desktop") args.push("--preset=desktop");
      console.log(`[performance] ${id}: ${url}`);
      const startedAt = new Date().toISOString();
      try {
        await execFileAsync(path.resolve("node_modules/.bin/lighthouse"), args, {
          env: {
            ...process.env,
            CHROME_PATH: process.env.CHROME_PATH ?? process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
          },
          timeout: 120_000,
          maxBuffer: 4 * 1024 * 1024,
        });
        const jsonPath = `${outputBase}.report.json`;
        const report = JSON.parse(await readFile(jsonPath, "utf8"));
        const requests = report.audits["network-requests"]?.details?.items ?? [];
        const thirdPartyOrigins = [...new Set(requests
          .filter((item) => /^https?:/.test(item.url ?? ""))
          .map((item) => new URL(item.url).origin)
          .filter((origin) => origin !== parsedBase.origin))].sort();
        runs.push({
          id,
          route: route.pathname,
          profile,
          trial,
          startedAt,
          fetchTime: report.fetchTime,
          lighthouseVersion: report.lighthouseVersion,
          finalDisplayedUrl: report.finalDisplayedUrl,
          scores: Object.fromEntries(Object.entries(report.categories).map(([key, category]) => [key, rounded(category.score * 100)])),
          seoDeductions: report.categories.seo.auditRefs
            .filter((reference) => report.audits[reference.id]?.score !== null && report.audits[reference.id]?.score < 1)
            .map((reference) => reference.id)
            .sort(),
          metrics: {
            lcpMs: rounded(report.audits["largest-contentful-paint"].numericValue),
            cls: rounded(report.audits["cumulative-layout-shift"].numericValue, 4),
            tbtMs: rounded(report.audits["total-blocking-time"].numericValue),
          },
          resources: {
            requests: requests.length,
            transferBytes: requests.reduce((total, item) => total + (item.transferSize ?? 0), 0),
            thirdPartyOrigins,
          },
          settings: {
            formFactor: report.configSettings.formFactor,
            throttlingMethod: report.configSettings.throttlingMethod,
            throttling: report.configSettings.throttling,
            screenEmulation: report.configSettings.screenEmulation,
          },
          reports: { json: path.relative(process.cwd(), jsonPath), html: path.relative(process.cwd(), `${outputBase}.report.html`) },
        });
      } catch (error) {
        runs.push({ id, route: route.pathname, profile, trial, startedAt, error: error instanceof Error ? error.message : String(error) });
        console.error(`[performance] ${id} failed; continuing remaining trials.`);
      }
    }
  }
}

const groups = [];
for (const route of routes) {
  for (const profile of profiles) {
    const successful = runs.filter((run) => run.route === route.pathname && run.profile === profile && !run.error);
    const expected = trials;
    if (successful.length !== expected) {
      groups.push({ route: route.pathname, profile, passed: false, reason: `${successful.length}/${expected} audits completed` });
      continue;
    }
    const categorySummaries = {};
    for (const category of ["performance", "accessibility", "best-practices", "seo"]) {
      categorySummaries[category] = summarize(successful.map((run) => run.scores[category]));
    }
    const seoDeductions = [...new Set(successful.flatMap((run) => run.seoDeductions))].sort();
    const result = {
      route: route.pathname,
      profile,
      indexable: route.indexable,
      completed: successful.length,
      scores: categorySummaries,
      seoDeductions,
      metrics: {
        lcpMs: summarize(successful.map((run) => run.metrics.lcpMs)),
        cls: summarize(successful.map((run) => run.metrics.cls), 4),
        tbtMs: summarize(successful.map((run) => run.metrics.tbtMs)),
      },
      resources: {
        requests: summarize(successful.map((run) => run.resources.requests), 0),
        transferBytes: summarize(successful.map((run) => run.resources.transferBytes), 0),
        thirdPartyOrigins: [...new Set(successful.flatMap((run) => run.resources.thirdPartyOrigins))].sort(),
      },
    };
    const seoPassed = route.indexable
      ? categorySummaries.seo.median >= budgets.otherCategory
      : successful.every((run) => run.seoDeductions.length === 1 && run.seoDeductions[0] === "is-crawlable");
    result.passed = categorySummaries.performance.median >= budgets.performance
      && ["accessibility", "best-practices"].every((category) => categorySummaries[category].median >= budgets.otherCategory)
      && seoPassed
      && result.metrics.lcpMs.median <= budgets.lcp
      && result.metrics.cls.median <= budgets.cls
      && result.metrics.tbtMs.median <= budgets.tbt;
    groups.push(result);
  }
}

const summary = {
  ...environment,
  completedAt: new Date().toISOString(),
  passed: groups.every((group) => group.passed) && runs.every((run) => !run.error),
  groups,
  runs,
};
const jsonPath = path.join(outputDirectory, "performance-summary.json");
await writeFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`);

const table = [
  "| Route | Profile | Perf median (range) | A11y | BP | SEO | LCP ms | CLS | TBT ms | Requests / transfer | Result |",
  "|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|",
  ...groups.map((group) => {
    if (!group.scores) return `| ${group.route} | ${group.profile} | — | — | — | — | — | — | — | — | FAIL: ${group.reason} |`;
    const performance = group.scores.performance;
    const score = (name) => group.scores[name].median;
    return `| ${group.route} | ${group.profile} | ${performance.median} (${performance.min}–${performance.max}) | ${score("accessibility")} | ${score("best-practices")} | ${score("seo")} | ${group.metrics.lcpMs.median} | ${group.metrics.cls.median} | ${group.metrics.tbtMs.median} | ${group.resources.requests.median} / ${group.resources.transferBytes.median} B | ${group.passed ? "PASS" : "FAIL"} |`;
  }),
];
const markdown = `# Lighthouse lab summary\n\nGenerated: ${summary.completedAt}. Base: ${baseUrl}. Trials: ${trials} per route/profile. This is simulated lab evidence, not field Core Web Vitals.\n\n${table.join("\n")}\n\nThe intentionally noindex /login route is exempt from the SEO score threshold only when every trial's sole SEO deduction is is-crawlable; its low score remains visible above. All indexable routes must meet the normal SEO budget.\n\nOverall: **${summary.passed ? "PASS" : "FAIL"}**. Full JSON/HTML reports are retained beside this file.\n`;
await writeFile(path.join(outputDirectory, "performance-summary.md"), markdown);
console.log(`\n${table.join("\n")}`);
console.log(`\n[performance] overall ${summary.passed ? "PASS" : "FAIL"}; summary: ${path.relative(process.cwd(), jsonPath)}`);
if (!summary.passed) process.exitCode = 1;
