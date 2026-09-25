import { expect, test } from "bun:test";
import { isPermittedEndpoint } from "./apiRoutes";

test("only bounded security, membership and decision routes can reach the backend", () => {
  for (const path of [
    "security/overview",
    "security/sessions",
    "security/sessions/id/questions",
    "security/mode",
    "security/simulations",
    "workspaces/switch",
    "invitations/id/accept",
    "approvals",
    "approvals/policies",
    "approvals/requests/id/votes",
    "agents/catalog",
  ])
    expect(isPermittedEndpoint(path)).toBe(true);
  for (const path of [
    "security/sessions/id/delete/all",
    "security/export/secrets",
    "workspaces/../vault",
    "agents/execute",
    "invitations/id/resend",
    "approvals/requests/id/execute",
    "security/sessions/https://evil.test",
  ])
    expect(isPermittedEndpoint(path)).toBe(false);
});
