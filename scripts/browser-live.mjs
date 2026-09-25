import assert from "node:assert/strict";
export async function verifyLiveAI(page, config, report, check) {
  await page
    .getByRole("combobox", { name: "Choose an AI model" })
    .selectOption("gpt-6-astra");
  await page
    .getByRole("textbox", {
      name: "Ask Oknef anything about your digital legacy…",
    })
    .fill(
      "Help me prepare my digital legacy. Give three safe steps based on my inventory, and explain why independent human review matters.",
    );
  const chatResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/chat") &&
      response.request().method() === "POST",
    { timeout: 180000 },
  );
  await page.getByRole("button", { name: "Send message" }).click();
  const response = await chatResponse;
  assert.equal(response.status(), 200);
  const answer = await response.json();
  assert(answer.cards.length > 0);
  assert.equal(answer.verification.source, "live_provider");
  await page.getByText(answer.cards[0].title, { exact: true }).waitFor();
  report.live.chat = {
    model: answer.model,
    provider: answer.provider,
    cards: answer.cards.length,
    verification: answer.verification,
  };
  check("live Astra response and rendered generative cards");
  await page.screenshot({
    path: `${config.output}/live-generative-answer.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", {
      name: "Generate an image in this conversation",
      exact: true,
    })
    .click();
  await page
    .getByRole("textbox", {
      name: "Ask Oknef anything about your digital legacy…",
    })
    .fill(
      "A calm minimal editorial illustration of a family connected to organized digital documents, sage green and cream, no text.",
    );
  const imageResponse = page.waitForResponse(
    (response) => response.url().endsWith("/api/chat/image"),
    { timeout: 180000 },
  );
  await page.getByRole("button", { name: "Send message" }).click();
  const image = await imageResponse;
  assert.equal(image.status(), 200);
  const result = await image.json();
  await page.getByRole("img", { name: "AI-generated visual" }).waitFor();
  report.live.image = {
    model: result.model,
    bytes: result.image_base64.length,
  };
  check("live image inside same chat");
  await page.screenshot({
    path: `${config.output}/live-image.png`,
    fullPage: true,
  });
}
export async function verifyVoice(page, report, check) {
  const response = page.waitForResponse(
    (item) => item.url().endsWith("/api/voice/call"),
    { timeout: 60000 },
  );
  await page
    .getByRole("button", { name: "Start a voice conversation" })
    .click();
  assert.equal((await response).status(), 200);
  await page
    .getByText("Voice is connected", { exact: true })
    .waitFor({ timeout: 30000 });
  await page
    .getByRole("button", { name: "End voice conversation" })
    .first()
    .click();
  await page
    .getByText("Voice is connected", { exact: true })
    .waitFor({ state: "detached" });
  report.live.voice = {
    negotiated: true,
    device: "synthetic browser microphone",
    humanMicrophoneTested: false,
  };
  check("live WebRTC connection and stop");
}
