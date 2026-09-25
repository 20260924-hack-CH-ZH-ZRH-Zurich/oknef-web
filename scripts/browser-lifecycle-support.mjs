import assert from "node:assert/strict";
import { expect } from "@playwright/test";
export function instrumentMedia() {
  const original = navigator.mediaDevices.getUserMedia.bind(
    navigator.mediaDevices,
  );
  const state = {
    streams: [],
    channels: [],
    hold: false,
    waiting: [],
    calls: 0,
  };
  window.__mediaQA = state;
  navigator.mediaDevices.getUserMedia = async (constraints) => {
    state.calls++;
    if (state.hold) await new Promise((resolve) => state.waiting.push(resolve));
    const stream = await original(constraints);
    state.streams.push(stream);
    return stream;
  };
  const create = RTCPeerConnection.prototype.createDataChannel;
  RTCPeerConnection.prototype.createDataChannel = function (...args) {
    const channel = create.apply(this, args);
    state.channels.push(channel);
    return channel;
  };
}

export async function checkAuthCleanup({
  page,
  context,
  assistant,
  send,
  hold,
  composer,
  settle,
  check,
  counts,
}) {
  await page.goto("/en/workspace");
  await page.getByRole("button", { name: "Ask Oknef", exact: true }).click();
  const drawer = page.getByRole("complementary", {
    name: "Ask Oknef",
    exact: true,
  });
  await drawer
    .getByRole("button", { name: "Dictate a message", exact: true })
    .click();
  await page.waitForFunction(() =>
    window.__mediaQA.streams.some((stream) =>
      stream.getTracks().some((track) => track.readyState === "live"),
    ),
  );
  const transcribeBeforeClose = counts().transcriptions;
  await drawer.getByRole("button", { name: "Close", exact: true }).click();
  await settle();
  assert(
    await page.evaluate(() =>
      window.__mediaQA.streams.every((stream) =>
        stream.getTracks().every((track) => track.readyState === "ended"),
      ),
    ),
  );
  assert.equal(counts().transcriptions, transcribeBeforeClose);
  check(
    "Closing the mounted global assistant cancels dictation and suppresses its recording callback",
  );
  for (const [command, capture] of [
    ["/call", "Record with microphone"],
    ["/qr", "Start camera"],
  ]) {
    await page.getByRole("button", { name: "Ask Oknef", exact: true }).click();
    await drawer
      .getByRole("textbox", {
        name: "Ask Oknef anything about your digital legacy…",
      })
      .fill(command);
    await drawer
      .getByRole("button", { name: "Send message", exact: true })
      .click();
    await expect(
      drawer.getByRole("textbox", { name: "Session name" }),
    ).toBeVisible();
    if (command === "/call") await drawer.getByRole("checkbox").first().check();
    await drawer.getByRole("button", { name: capture, exact: true }).click();
    await page.waitForFunction(() =>
      window.__mediaQA.streams.some((stream) =>
        stream.getTracks().some((track) => track.readyState === "live"),
      ),
    );
    await drawer
      .getByRole("button", { name: "Close", exact: true })
      .first()
      .click();
    await page.waitForFunction(() =>
      window.__mediaQA.streams.every((stream) =>
        stream.getTracks().every((track) => track.readyState === "ended"),
      ),
    );
    check(`Closing global assistant releases inline ${command} capture`);
  }
  await assistant();
  await page
    .getByRole("button", { name: "Dictate a message", exact: true })
    .click();
  await page.waitForFunction(() =>
    window.__mediaQA.streams.some((stream) =>
      stream.getTracks().some((track) => track.readyState === "live"),
    ),
  );
  const second = await context.newPage();
  await second.goto("/en/workspace?view=assistant");
  await expect(
    second.getByRole("button", { name: "New conversation", exact: true }),
  ).toBeVisible();
  let releaseLogout, logoutReached;
  const logoutSeen = new Promise((resolve) => {
    logoutReached = resolve;
  });
  const logoutGate = new Promise((resolve) => {
    releaseLogout = resolve;
  });
  await second.route("**/api/auth/logout", async (route) => {
    logoutReached();
    await logoutGate;
    await route.continue();
  });
  await second
    .getByRole("button", { name: "Sign out", exact: true })
    .first()
    .click();
  await logoutSeen;
  await page.waitForFunction(() =>
    window.__mediaQA.streams.every((stream) =>
      stream.getTracks().every((track) => track.readyState === "ended"),
    ),
  );
  await expect(composer()).toHaveCount(0);
  releaseLogout();
  await page.waitForURL("**/login", { timeout: 30000 });
  await second.close();
  check(
    "Logout in another tab closes capture and unmounts the old workspace before the auth mutation returns",
  );
  await page.goto("/en/login");
  await page
    .getByRole("combobox", { name: "Change demo role" })
    .selectOption("personal");
  await page.waitForURL("**/workspace");
  await assistant();
  const localHold = await hold("**/api/integrations");
  await send("Review @integrations before logout");
  await localHold.reached;
  let releaseLocalLogout, localLogoutReached;
  const localLogoutSeen = new Promise((resolve) => {
    localLogoutReached = resolve;
  });
  const localLogoutGate = new Promise((resolve) => {
    releaseLocalLogout = resolve;
  });
  await page.route("**/api/auth/logout", async (route) => {
    localLogoutReached();
    await localLogoutGate;
    await route.continue();
  });
  const postsBeforeLogout = counts().chatPosts;
  await page
    .getByRole("button", { name: "Sign out", exact: true })
    .first()
    .click();
  await localLogoutSeen;
  await localHold.release();
  assert.equal(counts().chatPosts, postsBeforeLogout);
  await expect(composer()).toHaveCount(0);
  releaseLocalLogout();
  await page.waitForURL("**/login");
  check(
    "Same-tab logout cancels delayed context work before auth/navigation completes",
  );
}

export async function holdResponse(page, path, method = "GET") {
  let release, captured;
  const reached = new Promise((resolve) => {
    captured = resolve;
  });
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const handler = async (route) => {
    if (route.request().method() !== method) return route.continue();
    const response = await route.fetch();
    captured();
    await gate;
    await route.fulfill({ response }).catch(() => {});
  };
  await page.route(path, handler);
  return {
    reached,
    release: async () => {
      release();
      await page.waitForTimeout(350);
      await page.unroute(path, handler);
    },
  };
}

export async function captureSignedOut(page, output) {
  await expect(
    page.getByRole("combobox", { name: "Change demo role" }),
  ).toBeVisible();
  await page.screenshot({
    path: `${output}/lifecycle-clean-session.png`,
    fullPage: true,
  });
}

export function trackLifecycleErrors(page, report) {
  report.network = [];
  page.on("pageerror", (error) => report.errors.push(error.message));
  page.on("response", (response) => {
    const path = new URL(response.url()).pathname;
    if (path === "/api/voice/call")
      report.network.push({ path, status: response.status() });
  });
  page.on("requestfailed", (request) => {
    const path = new URL(request.url()).pathname;
    if (path === "/api/voice/call")
      report.network.push({ path, failure: request.failure()?.errorText });
  });
}
