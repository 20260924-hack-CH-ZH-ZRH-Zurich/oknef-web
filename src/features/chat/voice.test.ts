import { expect, test } from "bun:test";
import { startDictation } from "./voice";

test("dictation releases tracks on constructor/start failure and cancel suppresses late data", async () => {
  const originalNavigator = Object.getOwnPropertyDescriptor(
    globalThis,
    "navigator",
  );
  const originalRecorder = Object.getOwnPropertyDescriptor(
    globalThis,
    "MediaRecorder",
  );
  let stopped = 0;
  let delivered = 0;
  let failure = "constructor";
  let latest: FakeRecorder | undefined;
  class FakeRecorder {
    static isTypeSupported() {
      return true;
    }
    mimeType = "audio/webm";
    state = "recording";
    onstop?: () => void;
    ondataavailable?: (event: { data: Blob }) => void;
    constructor() {
      if (failure === "constructor") throw new Error("constructor failure");
      latest = this;
    }
    start() {
      if (failure === "start") throw new Error("start failure");
    }
    stop() {
      if (this.state === "inactive")
        throw new DOMException("already inactive", "InvalidStateError");
      this.state = "inactive";
      queueMicrotask(() => this.onstop?.());
    }
  }
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      mediaDevices: {
        getUserMedia: async () => ({
          getTracks: () => [
            {
              stop: () => {
                stopped++;
              },
            },
          ],
        }),
      },
    },
  });
  Object.defineProperty(globalThis, "MediaRecorder", {
    configurable: true,
    value: FakeRecorder,
  });
  try {
    await expect(
      startDictation(() => {
        delivered++;
      }),
    ).rejects.toThrow("constructor failure");
    expect(stopped).toBe(1);
    failure = "start";
    await expect(
      startDictation(() => {
        delivered++;
      }),
    ).rejects.toThrow("start failure");
    expect(stopped).toBe(2);
    failure = "";
    const cancelled = await startDictation(() => {
      delivered++;
    });
    cancelled.cancel();
    latest?.ondataavailable?.({ data: new Blob(["late recording"]) });
    await Promise.resolve();
    cancelled.stop();
    expect(stopped).toBe(3);
    expect(delivered).toBe(0);
    const completed = await startDictation(() => {
      delivered++;
    });
    completed.stop();
    await Promise.resolve();
    expect(stopped).toBe(4);
    expect(delivered).toBe(1);
    const spontaneous = await startDictation(() => {
      delivered++;
    });
    if (!latest) throw new Error("Recorder was not created");
    latest.state = "inactive";
    latest.onstop?.();
    spontaneous.cancel();
    expect(stopped).toBe(5);
    expect(delivered).toBe(2);
  } finally {
    if (originalNavigator)
      Object.defineProperty(globalThis, "navigator", originalNavigator);
    else Reflect.deleteProperty(globalThis, "navigator");
    if (originalRecorder)
      Object.defineProperty(globalThis, "MediaRecorder", originalRecorder);
    else Reflect.deleteProperty(globalThis, "MediaRecorder");
  }
});
