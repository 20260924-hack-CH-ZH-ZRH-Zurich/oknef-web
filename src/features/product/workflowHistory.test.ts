import { expect, test } from "bun:test";
import { workflowRunSchema } from "./runContracts";

const pending = {
  id: "run",
  workflow: "qr-review",
  locale: "en",
  status: "pending",
  run_state: "pending",
  created_at: 1790352000,
  started_at: 1790352000,
  updated_at: 1790352000,
  completed_at: null,
  created_by: "actor",
  synthetic: true,
  input_sha256: "a".repeat(64),
  executed_actions: [],
  provider: "openclaw-via-rust-core",
};
test("pending and failed agent runs cannot acquire invented findings or execution", () => {
  expect(workflowRunSchema.safeParse(pending).success).toBe(true);
  const failed = {
    ...pending,
    status: "failed",
    run_state: "failed",
    completed_at: 1790352100,
    error_code: "workflow_timeout",
    upstream_status: null,
  };
  expect(workflowRunSchema.safeParse(failed).success).toBe(true);
  expect(
    workflowRunSchema.safeParse({
      ...failed,
      findings: [{ answer: "fabricated" }],
    }).success,
  ).toBe(false);
  expect(
    workflowRunSchema.safeParse({ ...failed, executed_actions: ["release"] })
      .success,
  ).toBe(false);
  expect(
    workflowRunSchema.safeParse({
      ...failed,
      error_code: "raw secret provider message",
    }).success,
  ).toBe(false);
});
