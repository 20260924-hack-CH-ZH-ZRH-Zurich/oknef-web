import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { verifyLiveAI, verifyVoice } from "./browser-live.mjs";
import { verifyPasskeys } from "./browser-passkeys.mjs";
import { verifyVault } from "./browser-security.mjs";
import { qaConfig } from "./qa-config.mjs";

const config = qaConfig();
await mkdir(config.output, { recursive: true });
const report = { checks: [], errors: [], live: {}, completed: false };
const browser = await chromium.launch({
  executablePath: config.executablePath,
  headless: true,
  args: [
    "--use-fake-device-for-media-stream",
    "--use-fake-ui-for-media-stream",
    ...(config.audioFile
      ? [`--use-file-for-fake-audio-capture=${config.audioFile}`]
      : []),
  ],
});
const context = await browser.newContext({
  baseURL: config.base,
  viewport: { width: 1440, height: 1000 },
  permissions: ["microphone"],
});
const page = await context.newPage();
page.on("pageerror", (error) => report.errors.push(error.message));
const check = (name) => {
  report.checks.push(name);
  console.info(`PASS ${name}`);
};
try {
  const landing = await page.goto("/");
  assert.equal(landing.status(), 200);
  assert(
    landing.headers()["content-security-policy"].includes("'strict-dynamic'"),
  );
  await page
    .getByRole("heading", { name: /Everything that matters/ })
    .waitFor();
  await page.screenshot({
    path: `${config.output}/landing-desktop.png`,
    fullPage: true,
  });
  check("landing and strict CSP");
  for (const [locale, text] of [
    ["de", "DE"],
    ["es", "ES"],
    ["fr", "FR"],
    ["en", "EN"],
  ]) {
    await page.locator("select").first().selectOption(locale);
    await page.waitForFunction(
      (expected) => document.documentElement.lang === expected,
      locale,
    );
    assert.equal(await page.locator("select").first().inputValue(), locale);
    check(`language ${text}`);
  }
  await page.getByRole("button", { name: "Change appearance" }).click();
  await page.waitForFunction(
    () => document.documentElement.dataset.theme === "dark",
  );
  await page.screenshot({
    path: `${config.output}/landing-dark.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Change appearance" }).click();
  check("light and dark appearance");
  await page.goto("/login");
  await page
    .getByRole("button", { name: "Continue with demo account" })
    .click();
  await page.waitForURL("**/workspace");
  await page.getByRole("heading", { name: /Good to have you here/ }).waitFor();
  const me = await context.request.get("/api/auth/me");
  const identity = await me.json();
  assert(identity.user.demo);
  const cookies = await context.cookies();
  assert(cookies.some((cookie) => cookie.httpOnly));
  check("isolated demo authentication and HttpOnly session");
  await page.screenshot({
    path: `${config.output}/workspace.png`,
    fullPage: true,
  });
  await page.goto("/workspace?view=vault");
  await page.getByRole("button", { name: "Add an asset", exact: true }).click();
  const name = `Browser QA ${Date.now()}`;
  await page.getByLabel("Asset name").fill(name);
  await page
    .getByLabel("Provider or institution")
    .fill("Fictional QA provider");
  await page.getByLabel("Estimated value (optional)").fill("1250");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByRole("heading", { name, exact: true }).waitFor();
  check("asset create persisted and rendered");
  await page.getByRole("button", { name: `Edit ${name}`, exact: true }).click();
  await page.getByLabel("Asset name").fill(`${name} edited`);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page
    .getByRole("heading", { name: `${name} edited`, exact: true })
    .waitFor();
  await page.reload();
  await page
    .getByRole("heading", { name: `${name} edited`, exact: true })
    .waitFor();
  check("asset edit persisted across reload");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download inventory" }).click();
  assert.equal((await download).suggestedFilename(), "oknef-inventory.json");
  check("inventory export");
  await page
    .getByRole("button", { name: `Delete ${name} edited`, exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await page
    .getByRole("heading", { name: `${name} edited`, exact: true })
    .waitFor({ state: "detached" });
  check("asset deletion confirmation and persistence");
  await page.goto("/workspace?view=succession");
  await page
    .getByRole("button", { name: "Create a legacy plan", exact: true })
    .first()
    .click();
  await page.getByLabel("Plan name").fill("Browser review plan");
  await page.getByLabel("Intended beneficiary").fill("Fictional family");
  await page
    .getByLabel("Guardian email addresses")
    .fill("guardian1@example.test, guardian2@example.test");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByRole("heading", { name: "Browser review plan" }).waitFor();
  const plan = page.locator("article").filter({
    has: page.getByRole("heading", { name: "Browser review plan" }),
  });
  await plan.getByRole("button", { name: "Request a review" }).click();
  await plan.getByRole("button", { name: "Review requested" }).waitFor();
  assert(
    await plan.getByRole("button", { name: "Review requested" }).isDisabled(),
  );
  check("succession human-review gate");
  await page.screenshot({
    path: `${config.output}/succession.png`,
    fullPage: true,
  });
  await verifyVault(page, context, config, check);
  await page.goto("/workspace?view=assistant");
  await page
    .getByRole("heading", {
      name: "A thoughtful partner for your digital life.",
    })
    .waitFor();
  const options = await page
    .getByRole("combobox", { name: "Choose an AI model" })
    .locator("option")
    .allTextContents();
  assert(options.length >= 2);
  check("configured model selector");
  await page.screenshot({ path: `${config.output}/chat.png`, fullPage: true });
  if (config.liveAI) await verifyLiveAI(page, config, report, check);
  if (config.voice) await verifyVoice(page, report, check);
  await page.goto("/deck/JO202609240900");
  await page.getByRole("heading", { name: /Your life/ }).waitFor();
  await page.getByRole("button", { name: "Next slide" }).click();
  await page.getByRole("heading", { name: /A lifetime online/ }).waitFor();
  await page.getByRole("button", { name: "Previous slide" }).click();
  await page.screenshot({ path: `${config.output}/pitch.png`, fullPage: true });
  check("pitch route and navigation");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: `${config.output}/landing-mobile.png`,
    fullPage: true,
  });
  await page.goto("/workspace?view=assistant");
  await page
    .getByRole("textbox", {
      name: "Ask Oknef anything about your digital legacy…",
    })
    .waitFor();
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: `${config.output}/chat-mobile.png`,
    fullPage: true,
  });
  check("mobile layout without horizontal overflow");
  const second = await browser.newContext({ baseURL: config.base });
  const isolated = await second.request.get("/api/dashboard");
  assert.equal(isolated.status(), 401);
  await second.close();
  check("unauthenticated workspace denied");
  await verifyPasskeys(page, context, config, report, check);
  assert.deepEqual(report.errors, []);
  report.completed = true;
} catch (error) {
  report.failure = error.message;
  await page
    .screenshot({ path: `${config.output}/failure.png`, fullPage: true })
    .catch(() => {});
  throw error;
} finally {
  await writeFile(
    `${config.output}/report.json`,
    JSON.stringify(report, null, 2),
  );
  await browser.close();
}
