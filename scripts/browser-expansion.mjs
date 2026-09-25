import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { verifyExpansionFlows } from "./browser-expansion-flows.mjs";
import { qaConfig } from "./qa-config.mjs";

const config = qaConfig();
assert(
  ["localhost", "127.0.0.1"].includes(new URL(config.base).hostname),
  "Expansion fixtures must run on a local test environment",
);
await mkdir(config.output, { recursive: true });
const report = {
  checks: [],
  errors: [],
  completed: false,
  data: "Isolated registered QA identities and controlled evidence; no real attack claims",
};
const browser = await chromium.launch({
  executablePath: config.executablePath,
  headless: true,
});
const contexts = [];
const check = (name) => {
  report.checks.push(name);
  console.info(`PASS ${name}`);
};
async function context() {
  const value = await browser.newContext({
    baseURL: config.base,
    viewport: { width: 1440, height: 1100 },
  });
  contexts.push(value);
  return value;
}
async function request(ctx, path, body, method = "POST") {
  const response = await ctx.request.fetch(`/api${path}`, {
    method,
    headers: { Origin: config.base },
    ...(body === undefined ? {} : { data: body }),
  });
  assert(response.ok(), `${method} ${path}: ${response.status()}`);
  return response.json();
}
async function register(name, account_type) {
  const ctx = await context();
  const email = `oknef-qa-${randomUUID()}@example.invalid`;
  const result = await request(ctx, "/auth/register", {
    name,
    email,
    password: `Oknef-Qa!${randomUUID()}`,
    account_type,
  });
  return { ctx, user: result.user };
}
async function security(ctx) {
  return request(ctx, "/security/overview", undefined, "GET");
}
async function screen(page, name) {
  await page.screenshot({
    path: `${config.output}/${name}.png`,
    fullPage: true,
  });
}
let page;
try {
  const localeContext = await context();
  page = await localeContext.newPage();
  page.on("pageerror", (error) => report.errors.push(error.message));
  for (const locale of ["en", "es", "de", "fr"]) {
    const response = await page.goto(`/${locale}/`);
    assert.equal(response.status(), 200);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("h1")).toBeVisible();
    assert(
      response
        .headers()
        ["content-security-policy"].includes("'strict-dynamic'"),
    );
  }
  check(
    "four locale roots render real pages, set language and preserve strict CSP",
  );
  const extension = await localeContext.request.get(
    "/downloads/oknef-extension.zip",
  );
  assert.equal(extension.status(), 200);
  assert.equal((await extension.body()).subarray(0, 2).toString(), "PK");
  check("extension deployment ZIP is served as an actual downloadable package");
  const owner = await register("QA Family Owner", "family");
  const reviewers = [
    await register("QA Reviewer One", "personal"),
    await register("QA Reviewer Two", "personal"),
  ];
  assert(owner.user?.id);
  page = await owner.ctx.newPage();
  page.on("pageerror", (error) => report.errors.push(error.message));
  await page.goto("/en/workspace?view=security");
  await expect(
    page.getByRole("heading", { name: "Your security, in context" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "QR destination", exact: true })
    .click();
  await page
    .getByLabel("Scan a QR image")
    .setInputFiles(
      fileURLToPath(new URL("./fixtures/qr.png", import.meta.url)),
    );
  await expect(page.getByLabel("Evidence to check")).toHaveValue(
    "https://example.invalid/confirm",
  );
  await page.getByLabel("Session name").fill("QA local QR evidence");
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Check and save", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "QA local QR evidence" }),
  ).toBeVisible();
  assert.equal((await security(owner.ctx)).sessions.length, 1);
  await screen(page, "security-qr");
  check("actual QR pixels decoded locally and saved as persistent evidence");
  await page.getByRole("button", { name: "Back to sessions" }).click();
  await page
    .getByRole("button", { name: "Email evidence", exact: true })
    .click();
  await page
    .getByLabel("Session name")
    .fill("QA controlled social engineering fixture");
  await page
    .getByLabel("Evidence to check")
    .fill(
      "Urgent: send your verification code and transfer money immediately. This is a controlled QA test fixture.",
    );
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Check and save", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "QA controlled social engineering fixture",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "New evidence needs your review" }),
  ).toBeVisible();
  await screen(page, "security-alert");
  await page.getByRole("button", { name: "Dismiss alert" }).click();
  await page.getByLabel("Your question").fill("Why did this require review?");
  await page.getByRole("button", { name: "Ask from stored evidence" }).click();
  await expect(
    page.getByText("Answer from stored evidence rules", { exact: true }),
  ).toBeVisible();
  await screen(page, "security-evidence");
  const reviewed = (await security(owner.ctx)).sessions.find(
    (item) => item.kind === "email",
  );
  assert.equal(reviewed.assessment.authenticity_verified, false);
  assert(reviewed.assessment.signals.length > 0);
  const detail = await request(
    owner.ctx,
    `/security/sessions/${reviewed.id}`,
    undefined,
    "GET",
  );
  assert.equal(detail.questions.length, 1);
  check(
    "persisted rule signals, live event toast and stored evidence Q&A work",
  );
  await page.getByRole("button", { name: "Back to sessions" }).click();
  await page
    .getByRole("combobox", { name: "Review preference" })
    .selectOption("paranoid");
  await expect
    .poll(async () => (await security(owner.ctx)).settings.mode)
    .toBe("paranoid");
  await screen(page, "security-workspace");
  const before = (await security(owner.ctx)).trends.reduce(
    (sum, point) => sum + point.checks,
    0,
  );
  await page
    .getByRole("button", { name: "Practice safely", exact: true })
    .click();
  await screen(page, "security-learning");
  await page
    .getByRole("button", { name: "Start practice session", exact: true })
    .first()
    .click();
  await expect(
    page.getByText("Synthetic · isolated", { exact: true }).first(),
  ).toBeVisible();
  const after = await security(owner.ctx);
  assert.equal(
    after.trends.reduce((sum, point) => sum + point.checks, 0),
    before,
  );
  assert(after.sessions.some((item) => item.synthetic));
  check(
    "mode persists and isolated practice does not enter real-evidence trend",
  );
  await page.getByRole("button", { name: "Forensic lab", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Compliance metrics" }),
  ).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "25",
  );
  await screen(page, "forensic-lab");
  await page.getByRole("button", { name: "Attack map", exact: true }).click();
  await screen(page, "attack-map");
  await page
    .getByRole("button", { name: "Asset topology", exact: true })
    .click();
  await screen(page, "asset-topology");
  check("evidence coverage, attack matrix and stored-record topology render");
  await verifyExpansionFlows({
    page,
    owner,
    reviewers,
    request,
    screen,
    check,
    config,
  });
  await page.goto("/workspace?view=admin");
  await expect(
    page.getByRole("heading", { name: "Agent operations" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open review", exact: true }),
  ).toHaveCount(9);
  await screen(page, "agent-operations");
  await page
    .locator('a[href="/workspace?view=assistant&workflow=qr-review"]')
    .click();
  await expect(
    page.getByRole("combobox", { name: "Review with agents" }),
  ).toHaveValue("qr-review");
  check("live agent catalog lists nine selectable advisory workflows");
  await page.goto("/workspace?view=security");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("heading", { name: "Your security, in context" }),
  ).toBeVisible();
  await screen(page, "security-mobile");
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
    false,
  );
  check("mobile security workspace has no horizontal page overflow");
  assert.deepEqual(report.errors, []);
  report.completed = true;
} catch (error) {
  report.failure = error instanceof Error ? error.message : String(error);
  if (page) await screen(page, "failure").catch(() => {});
  throw error;
} finally {
  await writeFile(
    `${config.output}/report.json`,
    JSON.stringify(report, null, 2),
  );
  for (const ctx of contexts) await ctx.close();
  await browser.close();
}
