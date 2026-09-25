import { expect, test } from "bun:test";
import {
  type SecurityEvent,
  sessionInputSchema,
  sessionSchema,
} from "./contracts";
import { securityMessages } from "./messages";
import { unseenAlerts } from "./useSecurity";

const session = {
  id: "record",
  kind: "qr",
  title: "User submission",
  content: "https://example.test",
  reference_text: null,
  created_by: "owner",
  created_at: 100000,
  updated_at: 100000,
  synthetic: false,
  assessment: {
    status: "no_signals",
    signals: [],
    method: "deterministic_rules_v1",
    calibrated: false,
    authenticity_verified: false,
    summary: "No rule matched",
    limitations: [],
    mode: "standard",
    independent_verification_required: false,
  },
  questions: [],
};
test("evidence contract rejects invented authentication and unknown action fields", () => {
  expect(sessionSchema.parse(session).created_at).toBe(
    "1970-01-02T03:46:40.000Z",
  );
  expect(
    sessionSchema.safeParse({
      ...session,
      assessment: { ...session.assessment, authenticity_verified: true },
    }).success,
  ).toBe(false);
  expect(
    sessionSchema.safeParse({ ...session, actions_executed: ["visit_url"] })
      .success,
  ).toBe(false);
  expect(
    sessionInputSchema.safeParse({
      kind: "qr",
      title: "X",
      content: "text",
      synthetic: false,
    }).success,
  ).toBe(false);
  expect(
    sessionInputSchema.safeParse({
      kind: "qr",
      title: "🗝".repeat(100),
      content: "text",
    }).success,
  ).toBe(false);
});
test("toasts use new persisted review events and exclude practice and repeats", () => {
  const event: SecurityEvent = {
    id: "new",
    session_id: "s",
    type: "security.review_required",
    severity: "medium",
    synthetic: false,
    created_at: "2026-09-25T00:00:00Z",
    title: "Evidence",
  };
  expect(unseenAlerts([event], new Set())).toEqual([event]);
  expect(unseenAlerts([event], new Set([event.id]))).toEqual([]);
  expect(
    unseenAlerts(
      [
        { ...event, synthetic: true },
        { ...event, type: "security.simulation" },
        { ...event, type: "security.session_checked" },
      ],
      new Set(),
    ),
  ).toEqual([]);
});
test("every security and workflow label has four language siblings", () => {
  const keys = Object.keys(securityMessages.en).sort();
  for (const locale of ["es", "de", "fr"] as const)
    expect(Object.keys(securityMessages[locale]).sort()).toEqual(keys);
});
