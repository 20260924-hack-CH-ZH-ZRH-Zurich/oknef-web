import { expect, test } from "bun:test";
import { startWorkspaceSocket } from "./workspaceSocket";

type Timer = ReturnType<typeof setTimeout>;
function fakeClock() {
  let now = 0;
  let sequence = 0;
  const jobs = new Map<number, { at: number; callback: () => void }>();
  return {
    set(callback: () => void, delay: number) {
      const id = ++sequence;
      jobs.set(id, { at: now + delay, callback });
      return id as unknown as Timer;
    },
    clear(timer: Timer) {
      jobs.delete(timer as unknown as number);
    },
    advance(duration: number) {
      const until = now + duration;
      for (;;) {
        const next = [...jobs.entries()]
          .filter(([, job]) => job.at <= until)
          .sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break;
        const [id, job] = next;
        jobs.delete(id);
        now = job.at;
        job.callback();
      }
      now = until;
    },
    get pending() {
      return jobs.size;
    },
  };
}

class FakeSocket {
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  closeCalls = 0;
  close() {
    this.closeCalls++;
    // A stalled browser handshake need not emit close after close().
  }
  open() {
    this.onopen?.(new Event("open"));
  }
  message() {
    this.onmessage?.(new MessageEvent("message"));
  }
  error() {
    this.onerror?.(new Event("error"));
  }
  capturedEvents() {
    const { onopen, onclose, onerror, onmessage } = this;
    return () => {
      onopen?.(new Event("open"));
      onclose?.(new Event("close"));
      onerror?.(new Event("error"));
      onmessage?.(new MessageEvent("message"));
    };
  }
}
function harness() {
  const timers = fakeClock();
  const sockets: FakeSocket[] = [];
  const states: boolean[] = [];
  let current = true;
  let refreshes = 0;
  const stop = startWorkspaceSocket(
    {
      createSocket: () => {
        const socket = new FakeSocket();
        sockets.push(socket);
        return socket;
      },
      isCurrent: () => current,
      onConnectionChange: (value) => states.push(value),
      onRefresh: () => refreshes++,
    },
    timers,
  );
  return {
    timers,
    sockets,
    states,
    stop,
    changeUser() {
      current = false;
    },
    get refreshes() {
      return refreshes;
    },
  };
}

test("a handshake that never opens closes at ten seconds and retries without a close event", () => {
  const h = harness();
  h.timers.advance(9999);
  expect(h.sockets).toHaveLength(1);
  expect(h.sockets[0].closeCalls).toBe(0);
  h.timers.advance(1);
  expect(h.sockets[0].closeCalls).toBe(1);
  expect(h.states.every((state) => !state)).toBe(true);
  expect(h.timers.pending).toBe(1);
  h.timers.advance(1000);
  expect(h.sockets).toHaveLength(2);
  expect(h.timers.pending).toBe(1);
  h.stop();
});

test("opening cancels the handshake watchdog and keeps the established socket", () => {
  const h = harness();
  h.sockets[0].open();
  expect(h.states.at(-1)).toBe(true);
  expect(h.timers.pending).toBe(0);
  h.timers.advance(60000);
  expect(h.sockets).toHaveLength(1);
  expect(h.sockets[0].closeCalls).toBe(0);
  h.stop();
  expect(h.timers.pending).toBe(0);
});

test("late events from a retired attempt cannot clobber a newer open socket", () => {
  const h = harness();
  const stale = h.sockets[0].capturedEvents();
  h.timers.advance(11000);
  h.sockets[1].open();
  const changes = h.states.length;
  stale();
  h.timers.advance(60000);
  expect(h.states).toHaveLength(changes);
  expect(h.states.at(-1)).toBe(true);
  expect(h.sockets).toHaveLength(2);
  expect(h.sockets[1].closeCalls).toBe(0);
  expect(h.refreshes).toBe(0);
  expect(h.timers.pending).toBe(0);
  h.stop();
});

test("disposing a connecting socket cancels all work and rejects queued events", () => {
  const h = harness();
  const stale = h.sockets[0].capturedEvents();
  h.stop();
  h.stop();
  stale();
  h.timers.advance(60000);
  expect(h.states).toEqual([false]);
  expect(h.sockets).toHaveLength(1);
  expect(h.sockets[0].closeCalls).toBe(1);
  expect(h.refreshes).toBe(0);
  expect(h.timers.pending).toBe(0);
});

test("a changed user scope rejects pending refresh and old connection events", () => {
  const h = harness();
  h.sockets[0].open();
  h.sockets[0].message();
  const stale = h.sockets[0].capturedEvents();
  h.changeUser();
  const changes = h.states.length;
  stale();
  h.timers.advance(200);
  expect(h.refreshes).toBe(0);
  expect(h.states).toHaveLength(changes);
  h.stop();
  expect(h.timers.pending).toBe(0);
});

test("disconnect cancels a pending refresh and dispose cancels its reconnect", () => {
  const h = harness();
  h.sockets[0].open();
  h.sockets[0].message();
  h.sockets[0].error();
  expect(h.states.at(-1)).toBe(false);
  expect(h.sockets[0].closeCalls).toBe(1);
  expect(h.timers.pending).toBe(1);
  h.stop();
  h.timers.advance(60000);
  expect(h.refreshes).toBe(0);
  expect(h.sockets).toHaveLength(1);
  expect(h.timers.pending).toBe(0);
});

test("current socket messages debounce refreshes while preserving connectivity", () => {
  const h = harness();
  h.sockets[0].open();
  h.sockets[0].message();
  h.timers.advance(100);
  h.sockets[0].message();
  h.timers.advance(199);
  expect(h.refreshes).toBe(0);
  h.timers.advance(1);
  expect(h.refreshes).toBe(1);
  expect(h.states.at(-1)).toBe(true);
  expect(h.timers.pending).toBe(0);
  h.stop();
});

test("retries back off after failures and reset after a successful open", () => {
  const h = harness();
  h.sockets[0].error();
  h.timers.advance(1000);
  h.sockets[1].error();
  h.timers.advance(1999);
  expect(h.sockets).toHaveLength(2);
  h.timers.advance(1);
  h.sockets[2].open();
  h.sockets[2].error();
  h.timers.advance(1000);
  expect(h.sockets).toHaveLength(4);
  h.stop();
});
