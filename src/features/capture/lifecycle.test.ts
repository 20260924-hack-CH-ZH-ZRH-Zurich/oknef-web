import { expect, test } from "bun:test";
import { stopActiveMedia } from "@/lib/mediaLifecycle";
import { observeCaptureLifecycle } from "./lifecycle";

test("backgrounding, pagehide and session stop release capture while visible events do not", () => {
  const page = new EventTarget();
  const visibility = Object.assign(new EventTarget(), { hidden: false });
  let releases = 0;
  const dispose = observeCaptureLifecycle(
    () => {
      releases++;
    },
    page,
    visibility,
  );
  visibility.dispatchEvent(new Event("visibilitychange"));
  expect(releases).toBe(0);
  visibility.hidden = true;
  visibility.dispatchEvent(new Event("visibilitychange"));
  expect(releases).toBe(1);
  page.dispatchEvent(new Event("pagehide"));
  expect(releases).toBe(2);
  stopActiveMedia();
  expect(releases).toBe(3);
  dispose();
  expect(releases).toBe(4);
  page.dispatchEvent(new Event("pagehide"));
  visibility.dispatchEvent(new Event("visibilitychange"));
  stopActiveMedia();
  expect(releases).toBe(4);
});
