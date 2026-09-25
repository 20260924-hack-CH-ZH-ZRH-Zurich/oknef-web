import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { expect } from "@playwright/test";

export async function verifyExpansionFlows({
  page,
  owner,
  reviewers,
  request,
  screen,
  check,
  config,
}) {
  await page.goto("/workspace?view=approvals");
  await expect(
    page.getByRole("heading", { name: "Decisions you can trace" }),
  ).toBeVisible();
  for (const reviewer of reviewers) {
    await page
      .getByRole("textbox", { name: "Email address", exact: true })
      .fill(reviewer.user.email);
    await page
      .getByRole("textbox", {
        name: "Recipient’s Oknef account ID",
        exact: true,
      })
      .fill(reviewer.user.id);
    await page
      .getByRole("button", { name: "Invite a reviewer", exact: true })
      .click();
    await expect(
      page.getByText("In-app invitation saved", { exact: true }),
    ).toBeVisible();
    const rp = await reviewer.ctx.newPage();
    await rp.goto("/workspace?view=approvals");
    await rp
      .getByRole("button", { name: "Accept invitation", exact: true })
      .click();
    await expect(
      rp.getByText("No invitations waiting", { exact: true }),
    ).toBeVisible();
    await rp
      .getByRole("combobox", { name: "Workspace", exact: true })
      .selectOption(owner.user.tenant_id);
    await rp.waitForURL("**/workspace");
  }
  await page
    .locator("main")
    .getByRole("button", { name: "Refresh", exact: true })
    .click();
  await expect(
    page.getByRole("checkbox", { name: /QA Reviewer One/ }),
  ).toBeVisible();
  await page.getByLabel("Policy name").fill("QA two-person investment review");
  await page.getByRole("checkbox", { name: /QA Reviewer One/ }).check();
  await page.getByRole("checkbox", { name: /QA Reviewer Two/ }).check();
  await page
    .getByRole("button", { name: "Create policy", exact: true })
    .click();
  await page.getByText("Request a decision", { exact: true }).click();
  await page
    .getByLabel("Decision title")
    .fill("QA proposed investment withdrawal");
  await page
    .getByLabel("Description", { exact: true })
    .fill("Controlled QA decision only; no money moves.");
  await page
    .getByRole("button", { name: "Create request", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "QA proposed investment withdrawal" }),
  ).toBeVisible();
  for (const reviewer of reviewers) {
    const rp = await reviewer.ctx.newPage();
    await rp.goto("/workspace?view=approvals");
    await expect(
      rp.getByRole("link", { name: "In-app notifications: 1", exact: true }),
    ).toBeVisible();
    await rp.getByRole("button", { name: "Approve", exact: true }).click();
    await expect(
      rp.getByRole("button", { name: "Approve", exact: true }),
    ).toHaveCount(0);
  }
  await page
    .locator("main")
    .getByRole("button", { name: "Refresh", exact: true })
    .click();
  await expect(page.getByText("Approved", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Decision map", exact: true }).click();
  await screen(page, "approvals-canvas");
  await page
    .locator("article")
    .filter({
      has: page.getByRole("heading", {
        name: "QA proposed investment withdrawal",
      }),
    })
    .screenshot({ path: `${config.output}/approvals-decision.png` });
  const decisions = await request(owner.ctx, "/approvals", undefined, "GET");
  assert.equal(decisions.requests[0].status, "approved");
  assert.equal(decisions.requests[0].votes.length, 2);
  assert.equal(decisions.requests[0].execution_enabled, false);
  check(
    "recipient-bound invitations, workspace switching, inbox and independent 2-of-2 decisions work end to end",
  );
  await page.goto("/workspace?view=files");
  await page
    .getByRole("button", { name: "Create a recipient identity" })
    .click();
  await page.getByLabel("I have safely saved my private recovery key.").check();
  await page.getByLabel("Choose a file (up to 2 MiB)").setInputFiles({
    name: "qa-source.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Oknef controlled local encryption check"),
  });
  const sealedDownload = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Encrypt and download .oknefq" })
    .click();
  const sealed = await sealedDownload;
  const sealedPath = `${config.output}/qa-protected.oknefq`;
  await sealed.saveAs(sealedPath);
  assert(
    !(await readFile(sealedPath, "utf8")).includes(
      "Oknef controlled local encryption check",
    ),
  );
  await page
    .getByLabel("Choose a protected .oknefq file")
    .setInputFiles(sealedPath);
  const plainDownload = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Decrypt and download original" })
    .click();
  const plain = await plainDownload;
  const plainPath = `${config.output}/qa-decrypted.txt`;
  await plain.saveAs(plainPath);
  assert.equal(
    await readFile(plainPath, "utf8"),
    "Oknef controlled local encryption check",
  );
  await page.getByRole("button", { name: "Clear keys" }).click();
  await screen(page, "file-protection");
  check(
    "real browser hybrid encryption/decryption round trip preserves source bytes locally",
  );
}
