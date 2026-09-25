import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
export async function verifyPasskeys(page, context, config, report, check) {
  const session = await context.newCDPSession(page);
  await session.send("WebAuthn.enable");
  const { authenticatorId } = await session.send(
    "WebAuthn.addVirtualAuthenticator",
    {
      options: {
        protocol: "ctap2",
        transport: "internal",
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true,
        automaticPresenceSimulation: true,
      },
    },
  );
  const email = `passkey-${randomUUID()}@example.test`;
  const registered = await context.request.post("/api/auth/register", {
    headers: { origin: config.base },
    data: {
      name: "Passkey browser verification",
      email,
      password: `Verification-${randomUUID()}`,
      account_type: "personal",
    },
  });
  assert.equal(registered.status(), 200);
  const original = await registered.json();
  await page.goto("/workspace?view=settings");
  const finish = page.waitForRequest((request) =>
    request.url().endsWith("/passkeys/register/finish"),
  );
  await page
    .getByRole("button", { name: "Add a passkey", exact: true })
    .click();
  await page.getByText("Passkey registered", { exact: true }).waitFor();
  const request = await finish;
  const replay = await context.request.post("/api/passkeys/register/finish", {
    headers: { origin: config.base },
    data: request.postDataJSON(),
  });
  assert.equal(replay.status(), 401);
  const wrongOrigin = await context.request.post(
    "/api/passkeys/register/start",
    { headers: { origin: "https://untrusted.example" }, data: {} },
  );
  assert.equal(wrongOrigin.status(), 403);
  check("real passkey registration, replay rejection, and origin rejection");
  await context.request.post("/api/auth/logout", {
    headers: { origin: config.base },
    data: {},
  });
  await page.goto("/login");
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page
    .getByRole("button", { name: "Sign in with a passkey", exact: true })
    .click();
  await page.waitForURL("**/workspace");
  const identity = await (await context.request.get("/api/auth/me")).json();
  assert.equal(identity.user.id, original.user.id);
  check("real passkey authentication with a virtual authenticator");
  report.live.passkeys = {
    registered: true,
    authenticated: true,
    virtualAuthenticator: true,
    physicalBiometricsTested: false,
  };
  await session.send("WebAuthn.removeVirtualAuthenticator", {
    authenticatorId,
  });
  await session.detach();
}
