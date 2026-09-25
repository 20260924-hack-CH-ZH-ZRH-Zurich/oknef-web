import { describe, expect, test } from "bun:test";
import response from "./__fixtures__/workflow-response.json";
import { workflowSchema } from "./workflows";

describe("covenant workflow response contract", () => {
  test("accepts every supported bounded workflow in the service response", () => {
    for (const workflow of [
      "legacy-review",
      "identity-review",
      "phishing-review",
      "qr-review",
      "call-review",
      "document-review",
      "recovery-review",
      "policy-review",
      "simulation-review",
    ] as const)
      expect(workflowSchema.parse({ ...response, workflow }).workflow).toBe(
        workflow,
      );
  });
  test("reviewer scope cannot omit truncation or accept action authority", () => {
    expect(
      workflowSchema.parse({
        ...response,
        review_scope: {
          truncated: true,
          input_characters: 9000,
          reviewed_characters: 6000,
        },
      }).review_scope.truncated,
    ).toBe(true);
    expect(
      workflowSchema.safeParse({ ...response, review_scope: undefined })
        .success,
    ).toBe(false);
    expect(
      workflowSchema.safeParse({
        ...response,
        review_scope: { ...response.review_scope, full_verification: true },
      }).success,
    ).toBe(false);
  });

  test("rejects unknown workflow names, extra fields, and executed actions", () => {
    expect(
      workflowSchema.safeParse({ ...response, workflow: "asset-release" })
        .success,
    ).toBe(false);
    expect(
      workflowSchema.safeParse({ ...response, release_enabled: true }).success,
    ).toBe(false);
    expect(
      workflowSchema.safeParse({ ...response, executed_actions: ["release"] })
        .success,
    ).toBe(false);
  });

  test("findings and verifier answers use the core's 40,000-byte bound", () => {
    for (const character of ["a", "é", "🗝"]) {
      const answer = character.repeat(
        40000 / new TextEncoder().encode(character).length,
      );
      const value = {
        ...response,
        findings: response.findings.map((finding) => ({ ...finding, answer })),
        review: { ...response.review, answer },
      };
      expect(workflowSchema.parse(value).review.answer).toBe(answer);
      expect(
        workflowSchema.safeParse({
          ...value,
          findings: [
            { ...value.findings[0], answer: answer + character },
            value.findings[1],
          ],
        }).success,
      ).toBe(false);
      expect(
        workflowSchema.safeParse({
          ...value,
          review: { ...value.review, answer: answer + character },
        }).success,
      ).toBe(false);
    }
  });

  test("requires the actual advisory status, agent roles, sources and two findings", () => {
    expect(
      workflowSchema.safeParse({ ...response, status: "approved" }).success,
    ).toBe(false);
    expect(
      workflowSchema.safeParse({
        ...response,
        findings: [response.findings[0]],
      }).success,
    ).toBe(false);
    expect(
      workflowSchema.safeParse({
        ...response,
        review: { ...response.review, source: "certified_identity" },
      }).success,
    ).toBe(false);
    expect(
      workflowSchema.safeParse({
        ...response,
        review: { ...response.review, agent: "manager" },
      }).success,
    ).toBe(false);
    expect(
      workflowSchema.safeParse({
        ...response,
        review: { ...response.review, execute: "release" },
      }).success,
    ).toBe(false);
  });
});
