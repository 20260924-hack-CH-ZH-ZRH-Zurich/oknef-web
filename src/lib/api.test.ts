import { describe, expect, test } from "bun:test";
import { assetSchema, cardSchema, chatSchema, imageSchema } from "./api";

describe("service response validation", () => {
  test("rejects unknown executable card properties and unsupported markup types", () => {
    const card = {
      type: "checklist",
      title: "Plan",
      body: "Review",
      items: ["Choose guardians"],
      severity: "info",
    };
    expect(cardSchema.safeParse(card).success).toBe(true);
    expect(
      cardSchema.safeParse({ ...card, onClick: "release_assets()" }).success,
    ).toBe(false);
    expect(cardSchema.safeParse({ ...card, type: "html" }).success).toBe(false);
    expect(
      cardSchema.safeParse({ ...card, items: Array(31).fill("item") }).success,
    ).toBe(false);
  });
  test("rejects unsafe image payloads", () => {
    expect(
      imageSchema.safeParse({
        image_base64: "aGVsbG8=",
        mime_type: "image/png",
        model: "configured",
        prompt: "diagram",
      }).success,
    ).toBe(true);
    expect(
      imageSchema.safeParse({
        image_base64: "aGVsbG8=",
        mime_type: "image/svg+xml",
        model: "configured",
        prompt: "diagram",
      }).success,
    ).toBe(false);
    expect(
      imageSchema.safeParse({
        image_base64: "https://external.invalid/image",
        mime_type: "image/png",
        model: "configured",
        prompt: "diagram",
      }).success,
    ).toBe(false);
  });
  test("does not accept an AI assertion that it executed a release", () => {
    const reply = {
      answer: "A suggestion",
      cards: [
        {
          type: "summary",
          title: "Review",
          body: "A suggestion",
          items: [],
          severity: "info",
        },
      ],
      model: "configured",
      provider: "configured",
      request_id: "request-1",
      verification: {
        status: "schema_validated",
        human_review_required: true,
        actions_executed: true,
        source: "live_provider",
      },
    };
    expect(chatSchema.safeParse(reply).success).toBe(false);
  });
  test("rejects secret-bearing fields and malformed amounts in asset replies", () => {
    const asset = {
      id: "asset-1",
      name: "Savings",
      category: "finance",
      institution: "Example",
      value: 10,
      currency: "CHF",
      notes: "Metadata only",
      beneficiary: "Family",
      created_at: "2026-09-25",
      updated_at: "2026-09-25",
    };
    expect(assetSchema.safeParse(asset).success).toBe(true);
    expect(
      assetSchema.safeParse({ ...asset, password: "never accepted" }).success,
    ).toBe(false);
    expect(assetSchema.safeParse({ ...asset, value: Number.NaN }).success).toBe(
      false,
    );
  });
});
