import { expect, test } from "bun:test";
import { requestBodyLimit } from "./requestLimits";

test("capture budget accepts a 20 MiB file plus multipart fields within the backend 21 MiB cap", () => {
  const allowed = requestBodyLimit("security/sessions/capture");
  expect(allowed).toBeGreaterThan(20 * 1024 * 1024 + 64000);
  expect(allowed).toBeLessThanOrEqual(21 * 1024 * 1024);
});
test("capture limit does not raise unrelated or unrecognized endpoint budgets", () => {
  expect(requestBodyLimit("security/sessions/id/assets")).toBe(100000);
  expect(requestBodyLimit("security/sessions/capture/extra")).toBe(100000);
  expect(requestBodyLimit("chat")).toBe(100000);
  expect(requestBodyLimit("ocr")).toBe(6000000);
});
