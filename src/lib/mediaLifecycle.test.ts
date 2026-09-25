import { expect, spyOn, test } from "bun:test";
import {
  listenSessionChange,
  registerMediaStop,
  resetConversation,
  sessionBoundary,
  stopActiveMedia,
} from "./mediaLifecycle";

test("conversation reset stops every registered voice before clearing session and draft", () => {
  const events: string[] = [];
  let microphone = true;
  const first = registerMediaStop(() => {
    microphone = false;
    events.push("voice-ended");
  });
  const second = registerMediaStop(() => events.push("dictation-cancelled"));
  resetConversation(
    () => {
      expect(microphone).toBe(false);
      events.push("session-cleared");
    },
    () => events.push("draft-cleared"),
  );
  expect(events).toEqual([
    "voice-ended",
    "dictation-cancelled",
    "session-cleared",
    "draft-cleared",
  ]);
  first();
  second();
});
test("session mutation releases the microphone before asynchronous logout or switch begins", async () => {
  let active = true;
  const dispose = registerMediaStop(() => {
    active = false;
  });
  const phases: string[] = [];
  const unsubscribe = listenSessionChange((phase) => {
    phases.push(phase);
  });
  try {
    const result = await sessionBoundary(async () => {
      expect(active).toBe(false);
      expect(phases).toEqual(["changing"]);
      await Promise.resolve();
      return "changed";
    });
    expect(result).toBe("changed");
    expect(phases).toEqual(["changing", "changed"]);
  } finally {
    unsubscribe();
    dispose();
  }
});
test("auth boundary and unmount release media and remove stale registrations", () => {
  let stops = 0;
  const dispose = registerMediaStop(() => stops++);
  stopActiveMedia();
  expect(stops).toBe(1);
  dispose();
  expect(stops).toBe(2);
  stopActiveMedia();
  expect(stops).toBe(2);
  const warning = spyOn(console, "warn").mockImplementation(() => undefined);
  const broken = registerMediaStop(() => {
    throw new Error("already stopped");
  });
  const remaining = registerMediaStop(() => {
    stops++;
  });
  try {
    stopActiveMedia();
    expect(stops).toBe(3);
    expect(warning).toHaveBeenCalledTimes(1);
  } finally {
    expect(() => broken()).toThrow("already stopped");
    remaining();
    warning.mockRestore();
  }
});
