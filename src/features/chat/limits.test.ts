import { expect, test } from "bun:test";
import { chatMessageTooLong } from "./limits";

test("current chat prompts use the core's UTF-8 byte boundary", () => {
  for (const [character, count] of [
    ["a", 12000],
    ["é", 6000],
    ["🗝", 3000],
  ] as const) {
    const accepted = character.repeat(count);
    const rejected = accepted + character;
    expect(chatMessageTooLong(accepted)).toBe(false);
    expect(chatMessageTooLong(rejected)).toBe(true);
    expect(rejected).toBe(character.repeat(count + 1));
  }
});
