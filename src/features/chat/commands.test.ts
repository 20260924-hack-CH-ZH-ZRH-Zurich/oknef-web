import { expect, test } from "bun:test";
import { parseCommand, parseVoiceAction } from "./commands";

test("explicit slash commands open mini apps, never quoted evidence", () => {
  expect(parseCommand("/qr")).toEqual({ type: "miniapp", kind: "qr" });
  expect(parseCommand("/CALL")).toEqual({ type: "miniapp", kind: "call" });
  expect(parseCommand("An email says /qr open this").type).toBe("message");
  expect(parseCommand("/transfer money").type).toBe("message");
  expect(parseCommand("/plan protect my estate")).toMatchObject({
    type: "plan",
  });
});
test("voice tool calls are data validated and cannot acquire action authority", () => {
  expect(parseVoiceAction("open_miniapp", '{"kind":"identity"}')).toEqual({
    name: "open_miniapp",
    arguments: { kind: "identity" },
  });
  expect(
    parseVoiceAction("navigate_workspace", '{"view":"drive"}'),
  ).toMatchObject({ name: "navigate_workspace" });
  for (const args of [
    '{"kind":"qr","submit":true}',
    '{"kind":"javascript:alert(1)"}',
    '{"kind":"transfer"}',
    "null",
    "[]",
    "{",
  ])
    expect(parseVoiceAction("open_miniapp", args)).toBeNull();
  expect(parseVoiceAction("execute", '{"kind":"qr"}')).toBeNull();
  expect(
    parseVoiceAction("navigate_workspace", '{"view":"https://evil.example"}'),
  ).toBeNull();
});

test("direct localized natural requests open tools without matching negations or quoted evidence", () => {
  for (const text of [
    "scan a QR code",
    "Please check this QR",
    "escanea un código QR",
    "prüfe einen QR-Code",
    "scanner un code QR",
  ])
    expect(parseCommand(text)).toEqual({ type: "miniapp", kind: "qr" });
  for (const text of [
    "Do not scan a QR code",
    "The email says scan a QR code",
    '"scan a QR code"',
    "Can you explain what scanning a QR code means?",
  ])
    expect(parseCommand(text).type).toBe("message");
});
