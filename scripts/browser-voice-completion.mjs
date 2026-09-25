import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import { qaConfig } from "./qa-config.mjs";

const config = qaConfig();
if (!config.audioFile) throw new Error("QA_AUDIO_FILE required");
await mkdir(config.output, { recursive: true });
const report = {
  checks: [],
  source: "synthetic spoken fixture over real provider WebRTC",
  humanMicrophoneTested: false,
  errors: [],
};
const browser = await chromium.launch({
  headless: true,
  executablePath: config.executablePath,
  args: [
    "--use-fake-device-for-media-stream",
    "--use-fake-ui-for-media-stream",
    `--use-file-for-fake-audio-capture=${config.audioFile}`,
  ],
});
const context = await browser.newContext({
  baseURL: config.base,
  permissions: ["microphone"],
  viewport: { width: 1280, height: 1000 },
});
await context.addInitScript(() => {
  const original = navigator.mediaDevices.getUserMedia.bind(
    navigator.mediaDevices,
  );
  globalThis.qaTracks = [];
  navigator.mediaDevices.getUserMedia = async (...args) => {
    const stream = await original(...args);
    globalThis.qaTracks.push(...stream.getTracks());
    return stream;
  };
});
const page = await context.newPage();
try {
  await page.goto("/en/login");
  await page
    .getByRole("combobox", { name: "Change demo role" })
    .selectOption("personal");
  await page.waitForURL("**/workspace");
  await page.goto("/en/workspace?view=assistant");
  const response = page.waitForResponse(
    (item) => item.url().endsWith("/api/voice/call"),
    { timeout: 60000 },
  );
  await page
    .getByRole("button", { name: "Start a voice conversation" })
    .click();
  assert.equal((await response).status(), 200);
  await expect(
    page.getByText("Voice is connected", { exact: true }),
  ).toBeVisible({ timeout: 30000 });
  report.checks.push("Real provider WebRTC connects");
  await expect(
    page.getByRole("heading", { name: "QR destination", exact: true }),
  ).toBeVisible({ timeout: 60000 });
  report.checks.push(
    "Spoken request opens inline QR mini-app through allowlisted provider tool",
  );
  await page
    .getByRole("button", { name: "Mute microphone", exact: true })
    .click();
  assert(
    await page.evaluate(() =>
      globalThis.qaTracks
        .filter(
          (track) => track.kind === "audio" && track.readyState === "live",
        )
        .every((track) => !track.enabled),
    ),
  );
  report.checks.push(
    "Mute disables live audio tracks while call stays connected",
  );
  await page
    .getByRole("button", { name: "Unmute microphone", exact: true })
    .click();
  assert(
    await page.evaluate(() =>
      globalThis.qaTracks
        .filter(
          (track) => track.kind === "audio" && track.readyState === "live",
        )
        .every((track) => track.enabled),
    ),
  );
  report.checks.push("Unmute reenables live audio tracks");
  await page
    .getByRole("button", { name: "End voice conversation" })
    .first()
    .click();
  assert(
    await page.evaluate(() =>
      globalThis.qaTracks.every((track) => track.readyState === "ended"),
    ),
  );
  report.checks.push("End conversation releases microphone tracks");
  const sessions = await (
    await context.request.get("/api/chat/sessions")
  ).json();
  assert(sessions.sessions.length > 0);
  const saved = await (
    await context.request.get(`/api/chat/sessions/${sessions.sessions[0].id}`)
  ).json();
  assert(
    saved.messages.some(
      (item) => item.provenance === "client_reported_realtime_transcript",
    ),
  );
  report.checks.push(
    "Realtime transcript persists with explicit client-reported provenance",
  );
  await page.screenshot({
    path: `${config.output}/voice-inline-qr.png`,
    fullPage: true,
  });
} catch (error) {
  report.errors.push(error.message);
  await page.screenshot({
    path: `${config.output}/voice-failure.png`,
    fullPage: true,
  });
  process.exitCode = 1;
} finally {
  await writeFile(
    `${config.output}/voice-report.json`,
    JSON.stringify(report, null, 2),
  );
  await browser.close();
  console.log(JSON.stringify(report));
}
