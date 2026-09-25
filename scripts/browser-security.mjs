import assert from "node:assert/strict";
export async function verifyVault(page, context, config, check) {
  await page.goto("/workspace?view=secrets");
  await page
    .getByRole("button", { name: "Create a recovery key", exact: true })
    .click();
  const recovery = await page
    .getByLabel("Recovery key", { exact: true })
    .inputValue();
  assert(recovery.startsWith("oknef-key-v1."));
  assert(
    await page
      .getByRole("button", { name: "Open encrypted vault", exact: true })
      .isDisabled(),
  );
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Open encrypted vault", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add encrypted record", exact: true })
    .click();
  const name = `Encrypted browser test ${Date.now()}`;
  const secret = "FICTIONAL-SECRET-ONLY-FOR-ENCRYPTION-VERIFICATION";
  await page.getByLabel("Record name", { exact: true }).fill(name);
  await page.getByLabel("Sensitive content", { exact: true }).fill(secret);
  await page
    .getByLabel("Private notes", { exact: true })
    .fill("Fictional browser verification record");
  const outbound = page.waitForRequest(
    (request) =>
      request.url().endsWith("/api/vault") && request.method() === "POST",
  );
  await page
    .getByRole("button", { name: "Encrypt and save", exact: true })
    .click();
  const request = await outbound;
  const body = request.postData() || "";
  assert(!body.includes(secret));
  assert(!body.includes(name));
  assert(!body.includes(recovery));
  await page
    .getByRole("button", { name: "Reveal record", exact: true })
    .last()
    .click();
  await page.getByText(secret, { exact: true }).waitFor();
  const response = await context.request.get("/api/vault");
  const stored = await response.text();
  assert(!stored.includes(secret));
  assert(!stored.includes(name));
  assert(!stored.includes(recovery));
  check("vault encrypts before network and stores opaque envelopes");
  await page.getByRole("button", { name: "Lock vault", exact: true }).click();
  await page.getByRole("heading", { name: "Your vault is locked" }).waitFor();
  assert((await page.getByText(secret, { exact: true }).count()) === 0);
  await page.reload();
  const localValues = await page.evaluate(() =>
    JSON.stringify({ ...localStorage }),
  );
  assert(!localValues.includes(recovery));
  assert(!localValues.includes(secret));
  await page.getByLabel("Recovery key", { exact: true }).fill(recovery);
  await page.getByRole("button", { name: "Unlock vault", exact: true }).click();
  await page
    .getByRole("button", { name: "Reveal record", exact: true })
    .last()
    .click();
  await page.getByText(secret, { exact: true }).waitFor();
  check("recovery-key import, reload lock, and local-only reveal");
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export encrypted .oknef file", exact: true })
    .last()
    .click();
  const artifact = await download;
  assert(artifact.suggestedFilename().endsWith(".oknef"));
  await artifact.saveAs(`${config.output}/encrypted-record.oknef`);
  check("portable encrypted .oknef export");
  await page
    .getByRole("button", { name: "Hide content", exact: true })
    .last()
    .click();
  await page.screenshot({
    path: `${config.output}/encrypted-vault.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Delete encrypted record", exact: true })
    .last()
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete encrypted record", exact: true })
    .click();
  await page.getByText("No encrypted records yet", { exact: true }).waitFor();
  check("encrypted record deletion");
}
