import { describe, expect, test } from "bun:test";
import { cardSchema, chatSchema } from "./api";

const card = {
  type: "summary",
  title: "Review",
  body: "Human review is required.",
  items: ["Check the evidence"],
  severity: "info",
};
const reply = {
  answer: "Advisory response",
  cards: [card],
  model: "configured",
  provider: "openai",
  request_id: "boundary-fixture",
  verification: {
    status: "schema_validated",
    human_review_required: true,
    actions_executed: false,
    source: "live_provider",
  },
};

describe("core generative response contract", () => {
  const boundaries = [
    {
      name: "answer",
      bytes: 40000,
      value: (text: string) => ({ ...reply, answer: text }),
    },
    {
      name: "title",
      bytes: 1000,
      value: (text: string) => ({
        ...reply,
        cards: [{ ...card, title: text }],
      }),
    },
    {
      name: "body",
      bytes: 12000,
      value: (text: string) => ({ ...reply, cards: [{ ...card, body: text }] }),
    },
    {
      name: "item",
      bytes: 2000,
      value: (text: string) => ({
        ...reply,
        cards: [{ ...card, items: [text] }],
      }),
    },
  ];

  for (const boundary of boundaries) {
    test(`${boundary.name} accepts the exact core byte limit and rejects larger ASCII or Unicode`, () => {
      for (const character of ["a", "é", "🗝"]) {
        const width = new TextEncoder().encode(character).length;
        const text = character.repeat(boundary.bytes / width);
        expect(chatSchema.safeParse(boundary.value(text)).success).toBe(true);
        expect(
          chatSchema.safeParse(boundary.value(text + character)).success,
        ).toBe(false);
      }
    });
  }

  test("matches card count, item count, supported types and severities", () => {
    expect(
      chatSchema.safeParse({ ...reply, cards: Array(5).fill(card) }).success,
    ).toBe(true);
    expect(
      chatSchema.safeParse({ ...reply, cards: Array(6).fill(card) }).success,
    ).toBe(false);
    expect(chatSchema.safeParse({ ...reply, cards: [] }).success).toBe(false);
    expect(chatSchema.safeParse({ ...reply, answer: "" }).success).toBe(false);
    expect(
      cardSchema.safeParse({ ...card, items: Array(30).fill("item") }).success,
    ).toBe(true);
    expect(
      cardSchema.safeParse({ ...card, items: Array(31).fill("item") }).success,
    ).toBe(false);
    for (const type of [
      "summary",
      "checklist",
      "steps",
      "warning",
      "comparison",
      "asset",
    ])
      expect(cardSchema.safeParse({ ...card, type }).success).toBe(true);
    for (const type of ["metric", "text", "table", "html"])
      expect(cardSchema.safeParse({ ...card, type }).success).toBe(false);
    for (const severity of ["info", "success", "warning", "critical"])
      expect(cardSchema.safeParse({ ...card, severity }).success).toBe(true);
    expect(
      cardSchema.safeParse({ ...card, severity: "approved" }).success,
    ).toBe(false);
  });

  test("retains strict fields and rejects false action authority", () => {
    expect(
      chatSchema.safeParse({ ...reply, release_assets: true }).success,
    ).toBe(false);
    expect(
      chatSchema.safeParse({
        ...reply,
        verification: { ...reply.verification, actions_executed: true },
      }).success,
    ).toBe(false);
    expect(
      chatSchema.safeParse({
        ...reply,
        verification: { ...reply.verification, human_review_required: false },
      }).success,
    ).toBe(false);
    expect(
      chatSchema.safeParse({
        ...reply,
        verification: { ...reply.verification, trusted: true },
      }).success,
    ).toBe(false);
  });
});
