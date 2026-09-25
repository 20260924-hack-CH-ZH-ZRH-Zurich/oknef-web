import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import { checkIdentityReset } from "./browser-lifecycle-identity.mjs";
import {
  captureSignedOut,
  checkAuthCleanup,
  holdResponse,
  instrumentMedia,
  trackLifecycleErrors,
} from "./browser-lifecycle-support.mjs";
import { qaConfig } from "./qa-config.mjs";

const config = qaConfig();
await mkdir(config.output, { recursive: true });
const report = {
  checks: [],
  errors: [],
  providerVoice: false,
  fixture:
    "Synthetic Chromium microphone and controlled response delays; no biometric claim",
};
const browser = await chromium.launch({
  headless: true,
  executablePath: config.executablePath,
  args: [
    "--use-fake-device-for-media-stream",
    "--use-fake-ui-for-media-stream",
  ],
});
const context = await browser.newContext({
  baseURL: config.base,
  permissions: ["microphone", "camera"],
  viewport: { width: 1440, height: 1050 },
});
await context.addInitScript(instrumentMedia);
const page = await context.newPage();
trackLifecycleErrors(page, report);
const check = (name) => {
  report.checks.push(name);
  console.log(`PASS ${name}`);
};
const composer = () =>
  page.getByRole("textbox", {
    name: "Ask Oknef anything about your digital legacy…",
  });
const newChat = () =>
  page.getByRole("button", { name: "New conversation", exact: true });
async function assistant() {
  await page.goto("/en/workspace?view=assistant");
  await expect(composer()).toBeVisible();
}
async function send(text) {
  await composer().fill(text);
  await page.getByRole("button", { name: "Send message", exact: true }).click();
}
async function settle() {
  await page.waitForTimeout(350);
}
const hold = (path, method) => holdResponse(page, path, method);
let chatPosts = 0,
  transcriptPosts = 0,
  transcriptions = 0;
page.on("request", (request) => {
  if (request.method() !== "POST") return;
  const path = new URL(request.url()).pathname;
  if (path === "/api/chat") chatPosts++;
  if (/\/chat\/sessions\/[^/]+\/messages$/.test(path)) transcriptPosts++;
  if (path === "/api/transcribe") transcriptions++;
});
try {
  await page.goto("/en/login");
  await page
    .getByRole("combobox", { name: "Change demo role" })
    .selectOption("personal");
  await page.waitForURL("**/workspace");
  await assistant();
  const contextHold = await hold("**/api/integrations");
  const before = chatPosts;
  await send("Review @integrations for stale context");
  await contextHold.reached;
  await newChat().click();
  await composer().fill("Fresh draft after reset");
  await contextHold.release();
  assert.equal(chatPosts, before);
  await expect(composer()).toHaveValue("Fresh draft after reset");
  check(
    "Reset cancels late selected-context resolution without submitting or erasing the fresh draft",
  );
  await newChat().click();
  const appHold = await hold("**/api/chat/sessions", "POST");
  await send("/qr");
  await appHold.reached;
  await newChat().click();
  await composer().fill("New draft after mini app cancellation");
  await appHold.release();
  await expect(page.getByRole("textbox", { name: "Session name" })).toHaveCount(
    0,
  );
  await expect(composer()).toHaveValue("New draft after mini app cancellation");
  check(
    "Reset cancels pending inline mini app session creation and preserves the new draft",
  );
  const seeded = await context.request.post("/api/chat/sessions", {
    headers: { Origin: config.base },
    data: { title: "Lifecycle delayed history" },
  });
  assert.equal(seeded.status(), 200);
  const session = await seeded.json();
  const message = await context.request.post(
    `/api/chat/sessions/${session.id}/messages`,
    {
      headers: { Origin: config.base },
      data: {
        role: "user",
        content: "STALE_HISTORY_MUST_NOT_REAPPEAR",
        source: "realtime_transcript",
      },
    },
  );
  assert.equal(message.status(), 200);
  await page.goto("/en/workspace?view=sessions");
  const historyHold = await hold(`**/api/chat/sessions/${session.id}`);
  await page.getByRole("button", { name: /Lifecycle delayed history/ }).click();
  await historyHold.reached;
  await newChat().click();
  await historyHold.release();
  await expect(
    page.getByText("STALE_HISTORY_MUST_NOT_REAPPEAR", { exact: true }),
  ).toHaveCount(0);
  check(
    "Reset aborts a late saved-history response so old messages do not repopulate the new session",
  );
  await assistant();
  await page.evaluate(() => {
    window.__mediaQA.hold = true;
  });
  await page
    .getByRole("button", { name: "Dictate a message", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Stop recording", exact: true })
    .click();
  await page.evaluate(() => {
    window.__mediaQA.hold = false;
    window.__mediaQA.waiting.splice(0).forEach((resolve) => {
      resolve();
    });
  });
  await page.waitForFunction(
    () =>
      window.__mediaQA.streams.length === 1 &&
      window.__mediaQA.streams.every((stream) =>
        stream.getTracks().every((track) => track.readyState === "ended"),
      ),
  );
  assert.equal(await page.evaluate(() => window.__mediaQA.calls), 1);
  assert.equal(transcriptions, 0);
  check(
    "Cancel while microphone permission is pending acquires only one stream and immediately releases the late grant",
  );
  await page
    .getByRole("button", { name: "Dictate a message", exact: true })
    .click();
  await page.waitForFunction(() =>
    window.__mediaQA.streams.some((stream) =>
      stream.getTracks().some((track) => track.readyState === "live"),
    ),
  );
  await send("/new");
  await settle();
  assert(
    await page.evaluate(() =>
      window.__mediaQA.streams.every((stream) =>
        stream.getTracks().every((track) => track.readyState === "ended"),
      ),
    ),
  );
  assert.equal(transcriptions, 0);
  check(
    "Typed /new cancels active dictation without transcribing discarded audio",
  );
  await page
    .getByRole("button", { name: "Dictate a message", exact: true })
    .click();
  await page.waitForFunction(() =>
    window.__mediaQA.streams.some((stream) =>
      stream.getTracks().some((track) => track.readyState === "live"),
    ),
  );
  let releaseTranscript, transcriptReached;
  const reachedTranscript = new Promise((resolve) => {
    transcriptReached = resolve;
  });
  const transcriptGate = new Promise((resolve) => {
    releaseTranscript = resolve;
  });
  const transcriptHandler = async (route) => {
    transcriptReached();
    await transcriptGate;
    await route
      .fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          text: "LATE_DICTATION_MUST_NOT_APPEAR",
          model: "controlled-ui-fixture",
        }),
      })
      .catch(() => {});
  };
  await page.route("**/api/transcribe", transcriptHandler);
  await page
    .getByRole("button", { name: "Stop recording", exact: true })
    .click();
  await reachedTranscript;
  await newChat().click();
  await composer().fill("Retained fresh text");
  releaseTranscript();
  await settle();
  await expect(composer()).toHaveValue("Retained fresh text");
  await page.unroute("**/api/transcribe", transcriptHandler);
  check(
    "Reset ignores a late transcription response instead of changing the new composer",
  );
  await newChat().click();
  await page
    .getByRole("button", { name: "Start a voice conversation", exact: true })
    .click();
  await expect(
    page.getByText("Voice is connected", { exact: true }),
  ).toBeVisible({ timeout: 60000 });
  report.providerVoice = true;
  const voiceHold = await hold("**/api/chat/sessions", "POST");
  await page.evaluate(() => {
    const channel = window.__mediaQA.channels.at(-1);
    for (const transcript of [
      "Controlled queued transcript one",
      "Controlled queued transcript two",
    ])
      channel.onmessage({
        data: JSON.stringify({
          type: "conversation.item.input_audio_transcription.completed",
          transcript,
        }),
      });
  });
  await voiceHold.reached;
  const writesBefore = transcriptPosts;
  await send("/new");
  await page.waitForFunction(() =>
    window.__mediaQA.streams.every((stream) =>
      stream.getTracks().every((track) => track.readyState === "ended"),
    ),
  );
  await expect(
    page.getByRole("button", {
      name: "Start a voice conversation",
      exact: true,
    }),
  ).toBeVisible();
  await voiceHold.release();
  assert.equal(transcriptPosts, writesBefore);
  await expect(
    page.getByText("Controlled queued transcript one", { exact: true }),
  ).toHaveCount(0);
  check(
    "Typed /new closes a real provider voice connection and cancels queued transcript writes before clearing its session",
  );
  await checkAuthCleanup({
    page,
    context,
    assistant,
    send,
    hold,
    composer,
    settle,
    check,
    counts: () => ({ transcriptions, chatPosts }),
  });
  await checkIdentityReset(page, context, check);
  await captureSignedOut(page, config.output);
} catch (error) {
  report.errors.push(error.stack || error.message);
  process.exitCode = 1;
  await page
    .screenshot({
      path: `${config.output}/lifecycle-failure.png`,
      fullPage: true,
    })
    .catch(() => {});
} finally {
  await writeFile(
    `${config.output}/lifecycle-report.json`,
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report));
  await browser.close();
}
