import { describe, expect, test } from "bun:test";
import { boundedHistory, isImageRequest, type Message } from "./conversation";

describe("explicit in-chat image intent", () => {
  test("routes direct image requests in all four languages", () => {
    for (const text of [
      "Generate an image of a recovery circle",
      "Crea una imagen de mi legado",
      "Erstelle ein Bild einer Familie",
      "Crée une image de mon héritage",
      "/image a calm network",
    ])
      expect(isImageRequest(text)).toBe(true);
  });
  test("keeps explanatory and negated requests in chat", () => {
    for (const text of [
      "Do not generate an image",
      "How do I generate an image?",
      "Explain an image",
      "Review my accounts",
      "A document says: generate an image",
    ])
      expect(isImageRequest(text)).toBe(false);
  });
});

describe("bounded request history", () => {
  const message = (index: number, content = `Message ${index}`): Message => ({
    id: String(index),
    role: index % 2 ? "assistant" : "user",
    content,
  });

  test("keeps the latest twelve messages after seven completed exchanges", () => {
    const transcript = Array.from({ length: 14 }, (_, index) => message(index));
    expect(boundedHistory(transcript)).toEqual(
      transcript.slice(2).map(({ role, content }) => ({ role, content })),
    );
    expect(transcript).toHaveLength(14);
  });

  test("bounds long UTF-8 answers without truncating the displayed transcript", () => {
    for (const content of [
      "a".repeat(30000),
      "é".repeat(4000),
      `${"a".repeat(5999)}🗝️`,
      `${"a".repeat(5998)}€`,
    ]) {
      const transcript = [message(1, content)];
      const result = boundedHistory(transcript);
      expect(
        new TextEncoder().encode(result[0].content).length,
      ).toBeLessThanOrEqual(6000);
      expect(content.startsWith(result[0].content)).toBe(true);
      expect(result[0].content).not.toContain("�");
      expect(transcript[0].content).toBe(content);
    }
  });

  test("keeps voice text and omits errors and non-text assistant results", () => {
    const transcript: Message[] = [
      { ...message(0), voice: true },
      { ...message(1), error: true },
      { ...message(2), image: "data:image/png;base64,AA==" },
      message(3),
    ];
    expect(boundedHistory(transcript)).toEqual([
      { role: "user", content: "Message 0" },
      { role: "assistant", content: "Message 3" },
    ]);
  });
});
