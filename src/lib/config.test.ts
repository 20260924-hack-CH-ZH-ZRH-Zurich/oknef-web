import { expect, test } from "bun:test";
import { serverConfig } from "./config";

test("backend destination must be an explicit credential-free origin", () => {
  const previous = process.env.OKNEF_BACKEND_URL;
  const previousOrigin = process.env.PUBLIC_ORIGIN;
  process.env.PUBLIC_ORIGIN = "https://oknef.example";
  try {
    for (const invalid of [
      "",
      "file:///etc/passwd",
      "https://user:password@example.test",
      "https://example.test/other",
    ]) {
      process.env.OKNEF_BACKEND_URL = invalid;
      expect(serverConfig).toThrow();
    }
    process.env.OKNEF_BACKEND_URL = "https://backend.example.test";
    expect(serverConfig().backend).toBe("https://backend.example.test");
    expect(serverConfig().publicOrigin).toBe("https://oknef.example");
    for (const invalid of [
      "",
      "https://oknef.example/path",
      "https://user:password@oknef.example",
      "https://oknef.example?test=1",
    ]) {
      process.env.PUBLIC_ORIGIN = invalid;
      expect(serverConfig).toThrow();
    }
  } finally {
    if (previousOrigin === undefined) delete process.env.PUBLIC_ORIGIN;
    else process.env.PUBLIC_ORIGIN = previousOrigin;
    if (previous === undefined) delete process.env.OKNEF_BACKEND_URL;
    else process.env.OKNEF_BACKEND_URL = previous;
  }
});
