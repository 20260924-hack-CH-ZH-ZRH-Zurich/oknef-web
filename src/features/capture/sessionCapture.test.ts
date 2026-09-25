import { expect, test } from "bun:test";
import { fingerprint } from "@/features/evidence/localStore";
import {
  captureSubmission,
  suggestedName,
  truncateUtf8,
} from "./sessionCapture";
import { sampleTimes } from "./videoFrames";

test("capture posts actual bytes and reviewed text, never a client-supplied digest", async () => {
  const file = new File(["actual evidence"], "../document.txt", {
    type: "text/plain",
  });
  const metadata = await fingerprint(file, "camera");
  const { body } = captureSubmission(
    {
      kind: "document",
      title: "Reviewed document",
      content: "reviewed extraction",
    },
    file,
    metadata,
    "fr",
  );
  expect(body.get("content")).toBe("reviewed extraction");
  expect(body.get("locale")).toBe("fr");
  expect(body.get("source")).toBe("camera");
  expect(body.has("sha256")).toBe(false);
  expect(body.has("evidence")).toBe(false);
  expect((body.get("file") as File).name).toBe(".._document.txt");
  expect(await (body.get("file") as File).text()).toBe("actual evidence");
});
test("video sample positions cover the beginning, middle and end without claiming full analysis", () => {
  expect(sampleTimes(10)).toEqual([1, 5, 9]);
  expect(() => sampleTimes(Infinity)).toThrow();
  expect(() => sampleTimes(0)).toThrow();
  expect(() => sampleTimes(Number.NaN)).toThrow();
});
test("automatic names preserve the original filename without its extension", () => {
  expect(suggestedName("Document", "passport.jpg")).toBe("Document · passport");
  expect(
    new TextEncoder().encode(suggestedName("Document", "a".repeat(500))).length,
  ).toBe(150);
});
test("multilingual names and notes obey UTF-8 server limits without splitting characters", () => {
  expect(truncateUtf8("😀éa", 5)).toBe("😀");
  expect(truncateUtf8("😀éa", 6)).toBe("😀é");
  expect(
    new TextEncoder().encode(truncateUtf8("é".repeat(2000), 1900)).length,
  ).toBe(1900);
});
