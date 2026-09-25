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
  globalThis.qaVoiceEvents = [];
  const createChannel = RTCPeerConnection.prototype.createDataChannel;
  RTCPeerConnection.prototype.createDataChannel = function (...args) {
    const channel = createChannel.apply(this, args);
    channel.addEventListener("message", (event) => {
      try {
        const value = JSON.parse(event.data);
        globalThis.qaVoiceEvents.push({
          type: value.type,
          status: value.response?.status,
          code: value.error?.code,
        });
      } catch {
        /* Ignore non-JSON diagnostics. */
      }
    });
    return channel;
  };
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
    .getByRole("button", { name: "Continue with demo account" })
    .click();
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
    .getByRole("button", { name: "Mute microphone", exact: true })
    .click();
  await page
    .getByRole("textbox", {
      name: "Ask Oknef anything about your digital legacy…",
    })
    .fill(
      "For this test, remember my project label: Cedar Brook. Reply with the label only.",
    );
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.locator("article.w-full").last()).toContainText(
    /Cedar Brook/i,
    { timeout: 30000 },
  );
  report.checks.push(
    "Typed text receives a spoken response within the same Realtime session",
  );
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
  const sessionId = sessions.sessions[0].id;
  let saved;
  await expect
    .poll(
      async () => {
        saved = await (
          await context.request.get(`/api/chat/sessions/${sessionId}`)
        ).json();
        return saved.messages.some(
          (item) =>
            item.role === "assistant" && /Cedar Brook/i.test(item.content),
        );
      },
      { timeout: 15000 },
    )
    .toBe(true);
  assert(
    saved.messages.some(
      (item) => item.provenance === "client_reported_realtime_transcript",
    ),
  );
  report.checks.push(
    "Realtime transcript persists with explicit client-reported provenance",
  );
  assert.equal(saved.messages[0].role, "user");
  report.checks.push(
    "Spoken user transcript is saved before its assistant response despite asynchronous transcription",
  );
  const firstEvents = await page.evaluate(() => globalThis.qaVoiceEvents);
  await page.goto("/en/workspace?view=sessions");
  await page
    .getByRole("button")
    .filter({
      has: page.getByRole("heading", { name: saved.title, exact: true }),
    })
    .click();
  await expect(page.locator("article.w-full").last()).toContainText(
    /Cedar Brook/i,
  );
  await page
    .getByRole("button", { name: "Start a voice conversation" })
    .click();
  await expect(
    page.getByText("Voice is connected", { exact: true }),
  ).toBeVisible({ timeout: 30000 });
  await page
    .getByRole("button", { name: "Mute microphone", exact: true })
    .click();
  const assistantCount = await page.locator("article.w-full").count();
  await page
    .getByRole("textbox", {
      name: "Ask Oknef anything about your digital legacy…",
    })
    .fill("What is my project label? Say only the label.");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect
    .poll(() => page.locator("article.w-full").count(), { timeout: 30000 })
    .toBeGreaterThan(assistantCount);
  await expect(page.locator("article.w-full").last()).toContainText(
    /Cedar Brook/i,
    { timeout: 30000 },
  );
  report.checks.push(
    "Reopened saved session restores provider context across voice reconnect",
  );
  await page
    .getByRole("button", { name: "End voice conversation" })
    .first()
    .click();
  await page.getByText("Voice identity policy", { exact: true }).click();
  await page
    .getByRole("combobox", { name: "Voice identity policy" })
    .selectOption("trusted_only");
  await expect(
    page.getByRole("button", { name: "Start a voice conversation" }),
  ).toBeDisabled();
  const denied = await context.request.post("/api/voice/session", {
    headers: { origin: config.base },
  });
  assert.equal(denied.status(), 403);
  report.checks.push(
    "Trusted-only mode blocks voice at both UI and backend while verifier is unavailable",
  );
  report.events = await page.evaluate(() => {
    const counts = {};
    for (const event of globalThis.qaVoiceEvents)
      counts[event.type] = (counts[event.type] || 0) + 1;
    return counts;
  });
  for (const event of firstEvents)
    report.events[event.type] = (report.events[event.type] || 0) + 1;
  await page.screenshot({
    path: `${config.output}/voice-inline-qr.png`,
    fullPage: true,
  });
} catch (error) {
  report.errors.push(error.message);
  report.events = await page.evaluate(() => globalThis.qaVoiceEvents || []);
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
