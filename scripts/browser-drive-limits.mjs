import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import { qaConfig } from "./qa-config.mjs";

const config = qaConfig();
await mkdir(config.output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: config.executablePath,
});
const context = await browser.newContext({
  baseURL: config.base,
  viewport: { width: 1440, height: 1100 },
  acceptDownloads: true,
});
const page = await context.newPage();
const report = { checks: [], uploads: [], errors: [], pageErrors: [] };
page.on("pageerror", (error) => report.pageErrors.push(error.message));
let attemptedUploads = 0;
page.on("request", (request) => {
  if (request.url().endsWith("/api/drive") && request.method() === "POST")
    attemptedUploads++;
});
try {
  await page.goto("/en/login");
  await page
    .getByRole("combobox", { name: "Change demo role" })
    .selectOption("personal");
  await page.waitForURL("**/workspace");
  await page.goto("/en/workspace?view=drive");
  await page.getByRole("button", { name: "Create a recovery key" }).click();
  await page
    .getByRole("checkbox", {
      name: "I have saved this recovery key securely and understand that losing it means losing access.",
    })
    .check();
  await page
    .getByRole("button", { name: "Open encrypted vault", exact: true })
    .click();
  for (const size of [1_000_000, 5_000_000]) {
    const buffer = Buffer.alloc(size);
    for (let i = 0; i < size; i++) buffer[i] = i % 251;
    const name = `synthetic-drive-${size}.bin`;
    await page
      .getByLabel("Choose a file", { exact: true })
      .setInputFiles({ name, mimeType: "application/octet-stream", buffer });
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/drive") &&
        response.request().method() === "POST",
      { timeout: 120000 },
    );
    await page.getByRole("button", { name: "Save", exact: true }).click();
    const response = await responsePromise;
    assert.equal(response.status(), 200);
    const item = await response.json();
    const serializedBytes = response.request().postDataBuffer().byteLength;
    if (size === 5_000_000)
      assert(serializedBytes > 8_800_000 && serializedBytes < 12 * 1024 * 1024);
    const record = page
      .locator("article")
      .filter({ has: page.getByText(item.id.slice(0, 8), { exact: true }) });
    await expect(record).toBeVisible();
    const downloadPromise = page.waitForEvent("download", { timeout: 60000 });
    await record
      .getByRole("button", { name: "Download original", exact: true })
      .click();
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), name);
    const recovered = await readFile(await download.path());
    assert.equal(recovered.byteLength, size);
    assert.equal(
      createHash("sha256").update(recovered).digest("hex"),
      createHash("sha256").update(buffer).digest("hex"),
    );
    report.uploads.push({
      file_bytes: size,
      serialized_request_bytes: serializedBytes,
      decrypted_bytes: recovered.byteLength,
      sha256_equal: true,
    });
    report.checks.push(
      `${size}-byte file encrypts, uploads and decrypts through the actual UI`,
    );
  }
  const before = attemptedUploads;
  await page.getByLabel("Choose a file", { exact: true }).setInputFiles({
    name: "oversize-synthetic.bin",
    mimeType: "application/octet-stream",
    buffer: Buffer.alloc(5_000_001),
  });
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "5 MB" }),
  ).toBeVisible();
  assert.equal(attemptedUploads, before);
  await expect(
    page.getByRole("heading", { name: "Encrypted records · 2", exact: true }),
  ).toBeVisible();
  report.checks.push(
    "5000001-byte file is rejected visibly before any API upload",
  );
  assert.deepEqual(report.pageErrors, []);
  await page.screenshot({
    path: `${config.output}/drive-size-boundary.png`,
    fullPage: true,
  });
} catch (error) {
  report.errors.push(error.message);
  await page
    .screenshot({
      path: `${config.output}/drive-size-failure.png`,
      fullPage: true,
    })
    .catch(() => {});
  process.exitCode = 1;
} finally {
  await writeFile(
    `${config.output}/drive-size-report.json`,
    JSON.stringify(report, null, 2),
  );
  await browser.close();
  console.log(JSON.stringify(report));
}
