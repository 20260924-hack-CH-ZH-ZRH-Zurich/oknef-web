import { expect, test } from "bun:test";
import { documentSchema } from "./documents";

test("document extraction cannot assert identity verification or executable fields", () => {
  const result = {
    summary: "Fictional statement",
    fields: [{ name: "Amount", value: "12 CHF", confidence: "low" }],
    warnings: ["Review the source"],
    source: "user_upload",
    verified_identity: false,
    model: "configured",
  };
  expect(documentSchema.safeParse(result).success).toBe(true);
  expect(
    documentSchema.safeParse({ ...result, verified_identity: true }).success,
  ).toBe(false);
  expect(
    documentSchema.safeParse({
      ...result,
      fields: [{ ...result.fields[0], action: "save" }],
    }).success,
  ).toBe(false);
  expect(
    documentSchema.safeParse({ ...result, source: "certified_identity" })
      .success,
  ).toBe(false);
});
