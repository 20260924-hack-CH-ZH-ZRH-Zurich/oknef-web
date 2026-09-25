import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import { verifyEvidenceStorage } from "./browser-evidence-storage.mjs";
import { verifyProductNavigation } from "./browser-product-navigation.mjs";
import { qaConfig } from "./qa-config.mjs";

const config = qaConfig();
await mkdir(config.output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: config.executablePath,
  args: [
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
    ...(config.videoFile
      ? [`--use-file-for-fake-video-capture=${config.videoFile}`]
      : []),
  ],
});
const context = await browser.newContext({
  baseURL: config.base,
  viewport: { width: 1440, height: 1100 },
  permissions: ["camera", "microphone"],
  acceptDownloads: true,
});
const page = await context.newPage();
const report = {
  checks: [],
  failures: [],
  apiFailures: [],
  pageErrors: [],
  screenshots: [],
};
page.on("pageerror", (error) => report.pageErrors.push(error.message));
page.on("response", (response) => {
  if (response.url().includes("/api/") && response.status() >= 400)
    report.apiFailures.push({
      path: new URL(response.url()).pathname,
      status: response.status(),
    });
});
const check = (name) => {
  report.checks.push(name);
  console.log(name);
};
const screen = async (name) => {
  const path = `${config.output}/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  report.screenshots.push(path);
};
try {
  await page.goto("/en/login");
  await page
    .getByRole("combobox", { name: "Change demo role" })
    .selectOption("personal");
  await page.waitForURL("**/workspace");
  await expect(
    page
      .getByRole("navigation")
      .getByRole("link", { name: "Oknef Drive", exact: true }),
  ).toBeVisible();
  check("Personal demo exposes Drive and product navigation");
  for (const [view, title] of [
    ["miniapps", "Mini apps"],
    ["connections", "Connections"],
    ["identities", "Identity wallet"],
    ["integrations", "Integrations"],
    ["sessions", "Sessions"],
    ["admin", "Oknef lab"],
  ]) {
    await page.goto(`/en/workspace?view=${view}`);
    await expect(
      page.getByRole("heading", { name: title, exact: true }).first(),
    ).toBeVisible();
    await screen(view);
  }
  check("Six product workspaces render authenticated API data");
  await page.goto("/en/workspace?view=integrations");
  await page
    .getByRole("textbox", { name: "Name", exact: true })
    .fill("Evidence mailbox");
  await page
    .getByRole("textbox", { name: "Account label" })
    .fill("Synthetic browser acceptance");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Evidence mailbox" }),
  ).toBeVisible();
  check("Connection registration persists without claiming authorization");
  await page.goto("/en/workspace?view=miniapps&app=qr");
  await page.getByRole("button", { name: "Start camera", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Stop camera", exact: true }),
  ).toBeVisible();
  if (config.videoFile) {
    await page
      .getByRole("textbox", { name: "Session name" })
      .fill("Camera QR evidence");
    await page
      .getByRole("button", { name: "Capture and check", exact: true })
      .click();
    await expect(
      page.getByRole("textbox", { name: "Evidence to check" }),
    ).toHaveValue("https://example.invalid/confirm");
    await expect(
      page.getByRole("button", { name: "Start camera", exact: true }),
    ).toBeVisible();
    await page.getByRole("checkbox").last().check();
    const saved = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/security/sessions") &&
        response.request().method() === "POST",
    );
    await page
      .getByRole("button", { name: "Check and save", exact: true })
      .click();
    const response = await saved;
    assert.equal(response.status(), 200);
    const session = await response.json();
    const cameraEvidence = session.evidence.find(
      (item) => item.source === "camera",
    );
    assert(cameraEvidence);
    assert.match(cameraEvidence.sha256, /^[a-f0-9]{64}$/);
    await expect(
      page.getByRole("heading", { name: "Camera QR evidence" }),
    ).toBeVisible();
    await page.goto("/en/workspace?view=drive");
    const original = page.locator("article").filter({
      has: page.getByRole("heading", { name: "qr-camera.png", exact: true }),
    });
    const downloadPromise = page.waitForEvent("download");
    await original.getByRole("button", { name: "Download original" }).click();
    const download = await downloadPromise;
    assert.equal(
      createHash("sha256")
        .update(await readFile(await download.path()))
        .digest("hex"),
      cameraEvidence.sha256,
    );
    check(
      "Synthetic camera pixels decode, stop and retain an original with matching SHA256",
    );
    await page.goto("/en/workspace?view=miniapps&app=qr");
  } else {
    await page
      .getByRole("button", { name: "Stop camera", exact: true })
      .click();
    check("Camera starts and stops with synthetic Chromium device");
  }
  await page
    .getByRole("textbox", { name: "Session name" })
    .fill("Captured QR evidence");
  await page
    .getByLabel("Scan a QR image", { exact: true })
    .setInputFiles(new URL("./fixtures/qr.png", import.meta.url).pathname);
  await expect(
    page.getByRole("textbox", { name: "Evidence to check" }),
  ).not.toHaveValue("");
  await page.getByRole("checkbox").last().check();
  await page
    .getByRole("button", { name: "Check and save", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Captured QR evidence" }),
  ).toBeVisible();
  check("QR pixels decode and save fingerprint with evidence");
  await screen("qr-evidence");
  await page.goto("/en/workspace?view=drive");
  await expect(
    page.getByRole("heading", { name: "qr.png", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Create a recovery key" }).click();
  await page
    .getByRole("checkbox", {
      name: "I have saved this recovery key securely and understand that losing it means losing access.",
    })
    .check();
  await page
    .getByRole("button", { name: "Open encrypted vault", exact: true })
    .click();
  await page.getByLabel("Choose a file", { exact: true }).setInputFiles({
    name: "acceptance-document.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Synthetic encrypted Drive roundtrip"),
  });
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Encrypted records · 1" }),
  ).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download original", exact: true })
    .first()
    .click();
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), "acceptance-document.txt");
  assert.equal(
    (await readFile(await download.path())).toString(),
    "Synthetic encrypted Drive roundtrip",
  );
  check("Drive ciphertext upload and decrypted download roundtrip");
  await screen("drive");
  await page.getByRole("button", { name: "Ask Oknef", exact: true }).click();
  const drawer = page.getByRole("complementary", { name: "Ask Oknef" });
  await expect(drawer).toBeVisible();
  await drawer
    .getByRole("textbox", {
      name: "Ask Oknef anything about your digital legacy…",
    })
    .fill("/qr");
  await drawer.getByRole("button", { name: "Send message" }).click();
  await expect(
    drawer.getByRole("heading", { name: "QR destination" }),
  ).toBeVisible();
  check("Global chat opens inline mini-app from slash command");
  await drawer
    .getByRole("textbox", {
      name: "Ask Oknef anything about your digital legacy…",
    })
    .fill("scan a QR code");
  await drawer.getByRole("button", { name: "Send message" }).click();
  await expect(
    drawer.getByRole("heading", { name: "QR destination" }),
  ).toBeVisible();
  check("Explicit ordinary typed request opens the same consent-gated QR form");
  await screen("chat-inline");
  await drawer
    .getByRole("button", { name: "Close", exact: true })
    .first()
    .click();
  if (config.liveAI) {
    await page.goto("/en/workspace?view=assistant");
    await page
      .getByRole("textbox", {
        name: "Ask Oknef anything about your digital legacy…",
      })
      .fill(
        "Review @integrations and give one safe next step. Do not claim that a provider is connected.",
      );
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/chat") &&
        response.request().method() === "POST",
      { timeout: 120000 },
    );
    await page.getByRole("button", { name: "Send message" }).click();
    const response = await responsePromise;
    assert.equal(response.status(), 200);
    const result = await response.json();
    await expect(
      page.getByText(result.cards[0].title, { exact: true }),
    ).toBeVisible();
    const history = await context.request.get(
      `/api/chat/sessions/${result.session_id}`,
    );
    assert.equal(history.status(), 200);
    assert.equal((await history.json()).messages.length, 1);
    check("Live AI context produces generative cards and persisted history");
    await screen("live-context-chat");
  }
  await verifyProductNavigation(page, context, check, screen);
  if (process.env.QA_EVIDENCE_BUNDLE) {
    report.storage = await verifyEvidenceStorage(browser, config);
    check(
      "Concurrent first-use evidence encryption survives two tabs,16 files and tamper rejection",
    );
  }
  assert.deepEqual(report.pageErrors, []);
  assert.deepEqual(report.apiFailures, []);
} catch (error) {
  report.failures.push(error.message);
  await screen("failure").catch(() => {});
  process.exitCode = 1;
} finally {
  await writeFile(
    `${config.output}/completion-report.json`,
    JSON.stringify(report, null, 2),
  );
  await browser.close();
  console.log(
    JSON.stringify({
      checks: report.checks.length,
      failures: report.failures,
      apiFailures: report.apiFailures,
      pageErrors: report.pageErrors,
    }),
  );
}
