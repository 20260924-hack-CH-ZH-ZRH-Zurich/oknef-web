import { afterEach, beforeEach, expect, test } from "bun:test";
import {
  MAX_CAPTURE_BYTES,
  recordStream,
  videoRecordingType,
} from "./recording";

const OriginalRecorder = globalThis.MediaRecorder;
let last: FakeRecorder;
class FakeRecorder {
  static isTypeSupported(type: string) {
    return type === "video/mp4";
  }
  mimeType = "video/mp4";
  state = "inactive";
  ondataavailable?: (event: { data: Blob }) => void;
  onstop?: () => void;
  onerror?: () => void;
  constructor() {
    last = this;
  }
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    this.onstop?.();
  }
  data(blob: Blob) {
    this.ondataavailable?.({ data: blob });
  }
}
beforeEach(() => {
  globalThis.MediaRecorder = FakeRecorder as unknown as typeof MediaRecorder;
});
afterEach(() => {
  globalThis.MediaRecorder = OriginalRecorder;
});
function stream() {
  let stopped = false;
  return {
    media: {
      getTracks: () => [
        {
          stop: () => {
            stopped = true;
          },
        },
      ],
    } as unknown as MediaStream,
    stopped: () => stopped,
  };
}

test("video capture uses a supported mobile MIME format", () => {
  expect(videoRecordingType((type) => type === "video/mp4")).toBe("video/mp4");
  expect(videoRecordingType(() => false)).toBeUndefined();
});
test("a completed capture contains actual emitted bytes and releases the camera", async () => {
  const device = stream();
  let completed: File | undefined;
  const handle = recordStream(
    device.media,
    (file) => {
      completed = file;
    },
    () => {
      throw new Error("unexpected error");
    },
  );
  last.data(new Blob(["recorded bytes"], { type: "video/mp4" }));
  handle.stop();
  expect(device.stopped()).toBe(true);
  expect(completed?.type).toBe("video/mp4");
  expect(completed?.name.endsWith(".mp4")).toBe(true);
  expect(await completed?.text()).toBe("recorded bytes");
});
test("cancel discards buffered and late capture data without emitting evidence", () => {
  const device = stream();
  let completed = 0;
  const handle = recordStream(
    device.media,
    () => {
      completed++;
    },
    () => {},
  );
  last.data(new Blob(["private evidence"]));
  handle.cancel();
  last.data(new Blob(["late bytes"]));
  last.onstop?.();
  expect(completed).toBe(0);
  expect(device.stopped()).toBe(true);
});
test("oversized recording fails closed and releases all tracks", () => {
  const device = stream();
  let errors = 0;
  let completed = false;
  recordStream(
    device.media,
    () => {
      completed = true;
    },
    () => {
      errors++;
    },
  );
  last.data(new Blob([new Uint8Array(MAX_CAPTURE_BYTES + 1)]));
  expect(errors).toBe(1);
  expect(completed).toBe(false);
  expect(device.stopped()).toBe(true);
});
test("empty recording and recorder errors never produce evidence", () => {
  const device = stream();
  let errors = 0;
  const first = recordStream(
    device.media,
    () => {
      throw new Error("empty recording emitted");
    },
    () => {
      errors++;
    },
  );
  first.stop();
  recordStream(
    device.media,
    () => {
      throw new Error("failed recording emitted");
    },
    () => {
      errors++;
    },
  );
  last.onerror?.();
  expect(errors).toBe(2);
});
