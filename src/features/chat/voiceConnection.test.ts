import { expect, test } from "bun:test";
import { startVoice } from "./voice";

function browserHarness() {
  const saved = new Map(
    ["navigator", "document", "RTCPeerConnection", "fetch"].map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ]),
  );
  const tracks: {
    enabled: boolean;
    stopped: boolean;
    stop: () => void;
    addEventListener: () => void;
  }[] = [];
  const stream = () => {
    const track = {
      enabled: true,
      stopped: false,
      stop() {
        this.stopped = true;
      },
      addEventListener() {},
    };
    tracks.push(track);
    return {
      getTracks: () => [track],
      getAudioTracks: () => [track],
    } as unknown as MediaStream;
  };
  let media = Promise.resolve(stream());
  let latest!: Peer;
  let removed = 0;
  const sent: Record<string, unknown>[] = [];
  class Peer {
    connectionState = "new";
    onconnectionstatechange?: () => void;
    channel = {
      readyState: "connecting",
      onmessage: undefined as ((event: { data: string }) => void) | undefined,
      send(value: string) {
        sent.push(JSON.parse(value));
      },
    };
    constructor() {
      latest = this;
    }
    close() {
      this.connectionState = "closed";
      this.channel.readyState = "closed";
    }
    addTrack() {}
    createDataChannel() {
      return this.channel;
    }
    async createOffer() {
      return { type: "offer", sdp: "v=0\r\n" };
    }
    async setLocalDescription() {}
    async setRemoteDescription() {
      this.connectionState = "connected";
      this.onconnectionstatechange?.();
    }
  }
  for (const [key, value] of Object.entries({
    navigator: { mediaDevices: { getUserMedia: () => media } },
    document: {
      body: { appendChild() {} },
      createElement: () => ({
        setAttribute() {},
        pause() {},
        remove() {
          removed++;
        },
      }),
    },
    RTCPeerConnection: Peer,
    fetch: async () => new Response("v=0\r\n"),
  }))
    Object.defineProperty(globalThis, key, { configurable: true, value });
  return {
    tracks,
    stream,
    sent,
    setMedia(value: Promise<MediaStream>) {
      media = value;
    },
    get peer() {
      return latest;
    },
    get removed() {
      return removed;
    },
    restore() {
      for (const [key, descriptor] of saved) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
      }
    },
  };
}
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

test("voice cancellation releases UI immediately and stops a late microphone grant", async () => {
  const h = browserHarness();
  try {
    let grant!: (value: MediaStream) => void;
    h.setMedia(
      new Promise((resolve) => {
        grant = resolve;
      }),
    );
    const controller = new AbortController();
    const result = startVoice(
      "en",
      () => {},
      () => {},
      controller.signal,
    );
    controller.abort();
    await expect(result).rejects.toThrow();
    expect(h.peer.connectionState).toBe("closed");
    expect(h.removed).toBe(1);
    grant(h.stream());
    await tick();
    expect(h.tracks.at(-1)?.stopped).toBe(true);
  } finally {
    h.restore();
  }
});

test("voice waits for event readiness, restores history, mutes and closes every track", async () => {
  const h = browserHarness();
  try {
    let ended = 0;
    let connected = false;
    const result = startVoice(
      "en",
      () => {},
      () => {
        ended++;
      },
      new AbortController().signal,
      undefined,
      { history: [{ role: "user", content: "My project is Cedar" }] },
    ).then((value) => {
      connected = true;
      return value;
    });
    await tick();
    expect(h.peer.connectionState).toBe("connected");
    expect(connected).toBe(false);
    expect(h.tracks[0].enabled).toBe(false);
    h.peer.channel.readyState = "open";
    h.peer.channel.onmessage?.({
      data: JSON.stringify({ type: "session.created" }),
    });
    const handle = await result;
    expect(h.tracks[0].enabled).toBe(true);
    expect(JSON.stringify(h.sent)).toContain("My project is Cedar");
    handle.setMuted(true);
    expect(h.tracks[0].enabled).toBe(false);
    handle.setMuted(false);
    expect(h.tracks[0].enabled).toBe(true);
    handle.close();
    handle.close();
    expect(h.tracks.every((track) => track.stopped)).toBe(true);
    expect(h.removed).toBe(1);
    expect(ended).toBe(0);
  } finally {
    h.restore();
  }
});
