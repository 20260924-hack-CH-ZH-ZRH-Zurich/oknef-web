import { expect, test } from "bun:test";
import {
  invitationInputSchema,
  invitationSchema,
  invitationsSchema,
  policyInputSchema,
  requestInputSchema,
} from "./contracts";

test("approval form requires a realizable quorum of distinct reviewers", () => {
  expect(
    policyInputSchema.safeParse({
      title: "Investment change",
      reviewer_ids: ["a", "b"],
      required_approvals: 2,
    }).success,
  ).toBe(true);
  for (const value of [
    { reviewer_ids: ["a", "a"], required_approvals: 2 },
    { reviewer_ids: ["a", "b"], required_approvals: 3 },
    { reviewer_ids: ["a"], required_approvals: 1 },
  ])
    expect(
      policyInputSchema.safeParse({ title: "Test", ...value }).success,
    ).toBe(false);
});
test("legacy invitation lists load while new invitation responses require recipient binding", () => {
  const legacy = {
    id: "legacy",
    email: "reviewer@example.test",
    role: "reviewer",
    tenant_id: "tenant",
    account_type: "family",
    workspace_name: "Family",
    inviter_name: "Owner",
    status: "pending",
    created_at: 1,
    expires_at: 2,
    delivery: "in_app",
    email_verified: false,
  };
  expect(
    invitationsSchema.safeParse({ incoming: [legacy], outgoing: [] }).success,
  ).toBe(true);
  expect(invitationSchema.safeParse(legacy).success).toBe(false);
});
test("invitation UI requires recipient binding and decision inputs reject action authority", () => {
  const input = {
    email: "reviewer@example.test",
    recipient_user_id: "d9428888-122b-4d44-8cfa-4391e3d2323e",
    role: "reviewer",
  };
  expect(invitationInputSchema.safeParse(input).success).toBe(true);
  expect(
    invitationInputSchema.safeParse({
      ...input,
      recipient_user_id: "------------------------------------",
    }).success,
  ).toBe(false);
  expect(
    invitationInputSchema.safeParse({ email: input.email, role: input.role })
      .success,
  ).toBe(false);
  expect(
    requestInputSchema.safeParse({
      policy_id: input.recipient_user_id,
      title: "Review",
      description: "Test",
      execute: true,
    }).success,
  ).toBe(false);
});
