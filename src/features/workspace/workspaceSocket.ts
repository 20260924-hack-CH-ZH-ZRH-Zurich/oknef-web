type Timer = ReturnType<typeof setTimeout>;
type Clock = {
  set: (callback: () => void, delay: number) => Timer;
  clear: (timer: Timer) => void;
};
type Socket = Pick<
  WebSocket,
  "onopen" | "onmessage" | "onclose" | "onerror" | "close"
>;
type Options = {
  createSocket: () => Socket;
  isCurrent: () => boolean;
  onConnectionChange: (connected: boolean) => void;
  onRefresh: () => void;
};
const clock: Clock = {
  set: (callback, delay) => setTimeout(callback, delay),
  clear: (timer) => clearTimeout(timer),
};
const HANDSHAKE_TIMEOUT_MS = 10000;
const INITIAL_RETRY_MS = 1000;
const MAX_RETRY_MS = 30000;

class WorkspaceSocket {
  private socket: Socket | null = null;
  private deadline?: Timer;
  private retry?: Timer;
  private update?: Timer;
  private delay = INITIAL_RETRY_MS;
  private stopped = false;

  constructor(
    private options: Options,
    private timers: Clock,
  ) {
    this.connect();
  }

  private active(socket: Socket) {
    return !this.stopped && this.options.isCurrent() && this.socket === socket;
  }

  private connect = () => {
    this.retry = undefined;
    if (this.stopped || !this.options.isCurrent()) return;
    this.options.onConnectionChange(false);
    try {
      const socket = this.options.createSocket();
      this.socket = socket;
      socket.onopen = () => this.open(socket);
      socket.onmessage = () => this.message(socket);
      socket.onclose = () => this.disconnect(socket, false);
      socket.onerror = () => this.disconnect(socket, true);
      this.deadline = this.timers.set(
        () => this.disconnect(socket, true),
        HANDSHAKE_TIMEOUT_MS,
      );
    } catch {
      console.warn("Workspace connection could not start");
      this.scheduleRetry();
    }
  };

  private open(socket: Socket) {
    if (!this.active(socket)) return;
    if (this.deadline !== undefined) this.timers.clear(this.deadline);
    this.deadline = undefined;
    this.delay = INITIAL_RETRY_MS;
    this.options.onConnectionChange(true);
  }

  private message(socket: Socket) {
    if (!this.active(socket)) return;
    if (this.update !== undefined) this.timers.clear(this.update);
    this.update = this.timers.set(() => {
      this.update = undefined;
      if (this.active(socket)) this.options.onRefresh();
    }, 200);
  }

  private detach(socket: Socket) {
    socket.onopen = null;
    socket.onmessage = null;
    socket.onclose = null;
    socket.onerror = null;
  }

  private clearTimers() {
    for (const timer of [this.deadline, this.retry, this.update])
      if (timer !== undefined) this.timers.clear(timer);
    this.deadline = undefined;
    this.retry = undefined;
    this.update = undefined;
  }

  private scheduleRetry() {
    if (this.stopped || !this.options.isCurrent()) return;
    this.retry = this.timers.set(this.connect, this.delay);
    this.delay = Math.min(this.delay * 2, MAX_RETRY_MS);
  }

  private disconnect(socket: Socket, close: boolean) {
    if (!this.active(socket)) return;
    this.clearTimers();
    this.detach(socket);
    this.socket = null;
    this.options.onConnectionChange(false);
    if (close) socket.close();
    // A stalled handshake may never dispatch close; retry independently.
    this.scheduleRetry();
  }

  stop() {
    if (this.stopped) return;
    this.stopped = true;
    this.clearTimers();
    const socket = this.socket;
    this.socket = null;
    if (socket) {
      this.detach(socket);
      socket.close();
    }
  }
}

export function startWorkspaceSocket(options: Options, timers: Clock = clock) {
  const connection = new WorkspaceSocket(options, timers);
  return () => connection.stop();
}
