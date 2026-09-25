import assert from "node:assert/strict";
import { expect } from "@playwright/test";

export async function checkIdentityReset(page, context, check) {
  let stage = 0;
  const reads = [];
  let firstUser;
  const inboxHandler = async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    body.incoming =
      stage === 1 && firstUser
        ? [
            {
              id: "controlled-tenant-a-invite",
              email: "fixture@example.invalid",
              recipient_user_id: firstUser.id,
              role: "reviewer",
              tenant_id: firstUser.tenant_id,
              account_type: "company",
              workspace_name: "CONTROLLED_TENANT_A_INBOX",
              inviter_name: "Controlled fixture",
              status: "pending",
              created_at: "2026-09-25T13:00:00Z",
              expires_at: "2026-09-26T13:00:00Z",
              delivery: "in_app",
              email_verified: false,
            },
          ]
        : [];
    await route.fulfill({ response, json: body });
  };
  const handler = async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    body.events =
      stage === 1
        ? [
            {
              id: "controlled-tenant-a-alert",
              session_id: "controlled-session-a",
              type: "security.review_required",
              severity: "warning",
              synthetic: false,
              created_at: "2026-09-25T13:00:00Z",
              title: "CONTROLLED_TENANT_A_ALERT",
            },
          ]
        : [];
    reads.push(stage);
    await route.fulfill({ response, json: body });
  };
  await page.route("**/api/security/overview", handler);
  await page.route("**/api/invitations", inboxHandler);
  await page.goto("/en/login");
  await page
    .getByRole("combobox", { name: "Change demo role" })
    .selectOption("personal");
  await page.waitForURL("**/workspace");
  await page.getByRole("button", { name: "Ask Oknef", exact: true }).waitFor();
  await expect.poll(() => reads.length).toBeGreaterThan(0);
  const first = await (await context.request.get("/api/auth/me")).json();
  firstUser = first.user || first;
  stage = 1;
  await page.evaluate(() => {
    const channel = new BroadcastChannel("oknef-session-boundary");
    channel.postMessage("changed");
    setTimeout(() => channel.close(), 100);
  });
  await expect(page.getByText(/CONTROLLED_TENANT_A_ALERT/)).toBeVisible();
  await expect(page.getByText(/CONTROLLED_TENANT_A_INBOX/)).toBeVisible();
  await expect(
    page.getByRole("link", { name: "In-app notifications: 1", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ask Oknef", exact: true }).click();
  await page
    .getByRole("textbox", {
      name: "Ask Oknef anything about your digital legacy…",
    })
    .fill("CONTROLLED_TENANT_A_DRAFT");
  stage = 2;
  const second = await context.newPage();
  await second.goto("/en/workspace");
  await second
    .getByRole("combobox", { name: "Change demo role" })
    .selectOption("company");
  await second.waitForURL("**/workspace");
  await expect
    .poll(() => reads.filter((value) => value === 2).length)
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: "Ask Oknef", exact: true }).waitFor();
  const last = await (await context.request.get("/api/auth/me")).json();
  const before = first.user || first,
    after = last.user || last;
  assert(before.id !== after.id || before.tenant_id !== after.tenant_id);
  await expect(page.getByText(/CONTROLLED_TENANT_A_ALERT/)).toHaveCount(0);
  await expect(page.getByText(/CONTROLLED_TENANT_A_INBOX/)).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "In-app notifications: 0", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("complementary", { name: "Ask Oknef", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Ask Oknef", exact: true }).click();
  await expect(
    page.getByRole("textbox", {
      name: "Ask Oknef anything about your digital legacy…",
    }),
  ).toHaveValue("");
  check(
    "A changed account and tenant reset security alerts, inbox count and alerts, drawer visibility, and draft together",
  );
  await second.close();
  await page.unroute("**/api/security/overview", handler);
  await page.unroute("**/api/invitations", inboxHandler);
  await page
    .getByRole("button", { name: "Sign out", exact: true })
    .first()
    .click();
  await page.waitForURL("**/login");
}
