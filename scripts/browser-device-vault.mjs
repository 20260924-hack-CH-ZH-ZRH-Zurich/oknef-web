import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import { qaConfig } from "./qa-config.mjs";

const config = qaConfig();
await mkdir(config.output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: config.executablePath,
});
const context = await browser.newContext({ baseURL: config.base });
const page = await context.newPage();
page.setDefaultTimeout(20000);
page.setDefaultNavigationTimeout(30000);
const report = {
  checks: [],
  virtualAuthenticator: true,
  physicalBiometricsTested: false,
  pageErrors: [],
};
page.on("pageerror", (error) => report.pageErrors.push(error.message));
const requests = [];
page.on("request", (request) => {
  if (request.url().includes("/api/")) requests.push(request.postData() ?? "");
});
const check = (message) => {
  report.checks.push(message);
  console.info(message);
};
try {
  const registered = await context.request.post("/api/auth/register", {
    headers: { origin: config.base },
    data: {
      name: "Device vault acceptance",
      email: `device-${randomUUID()}@example.test`,
      password: `test-${randomUUID()}`,
      account_type: "personal",
    },
  });
  assert.equal(registered.status(), 200);
  console.info("Registered isolated acceptance account");
  const cdp = await context.newCDPSession(page);
  await cdp.send("WebAuthn.enable");
  const { authenticatorId } = await cdp.send(
    "WebAuthn.addVirtualAuthenticator",
    {
      options: {
        protocol: "ctap2",
        ctap2Version: "ctap2_1",
        transport: "internal",
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true,
        automaticPresenceSimulation: true,
        hasPrf: true,
      },
    },
  );
  await page.goto("/en/workspace?view=secrets");
  await page
    .getByRole("button", { name: "Create a recovery key", exact: true })
    .click();
  console.info("Generated vault key");
  const recovery = await page
    .getByLabel("Recovery key", { exact: true })
    .inputValue();
  await page
    .getByLabel("Enable passkey unlock on this browser", { exact: true })
    .check();
  await page
    .getByRole("checkbox")
    .filter({ hasNot: page.locator("[disabled]") })
    .last()
    .check();
  await page
    .getByRole("button", { name: "Open encrypted vault", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add encrypted record", exact: true })
    .waitFor();
  check("PRF-enabled virtual passkey enrolls a local encrypted vault wrapper");
  const stored = await page.evaluate(() =>
    Object.keys(localStorage)
      .filter((key) => key.startsWith("oknef-device-vault-v1:"))
      .map((key) => localStorage.getItem(key)),
  );
  assert.equal(stored.length, 1);
  assert(!stored[0].includes(recovery));
  await page
    .getByRole("button", { name: "Add encrypted record", exact: true })
    .click();
  await page
    .getByLabel("Record name", { exact: true })
    .fill("Device unlock QA");
  await page
    .getByLabel("Sensitive content", { exact: true })
    .fill("synthetic-acceptance-record");
  await page
    .getByRole("button", { name: "Encrypt and save", exact: true })
    .click();
  await page.getByRole("button", { name: "Lock vault", exact: true }).click();
  await page
    .getByRole("button", { name: "Unlock with a passkey", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Reveal record", exact: true })
    .click();
  await expect(
    page.getByText("synthetic-acceptance-record", { exact: true }),
  ).toBeVisible();
  check("Authenticator PRF decrypts the persisted vault record after locking");
  assert(
    requests.every(
      (body) =>
        !body.includes(recovery) &&
        !body.includes("synthetic-acceptance-record"),
    ),
  );
  check("Recovery key and plaintext stay out of API request bodies");
  await page.getByRole("button", { name: "Lock vault", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Remove passkey unlock from this browser",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", { name: "Unlock with a passkey", exact: true }),
  ).toHaveCount(0);
  await page.getByLabel("Recovery key", { exact: true }).fill(recovery);
  await page.getByRole("button", { name: "Unlock vault", exact: true }).click();
  await page
    .getByRole("button", { name: "Reveal record", exact: true })
    .click();
  await expect(
    page.getByText("synthetic-acceptance-record", { exact: true }),
  ).toBeVisible();
  check("Removing the device shortcut preserves recovery-key access");
  await cdp.send("WebAuthn.removeVirtualAuthenticator", { authenticatorId });
  assert.deepEqual(report.pageErrors, []);
} finally {
  await writeFile(
    `${config.output}/device-vault.json`,
    JSON.stringify(report, null, 2),
  );
  await browser.close();
}
