const mediaStops = new Set<() => void>();
export function registerMediaStop(stop: () => void) {
  mediaStops.add(stop);
  return () => {
    mediaStops.delete(stop);
    stop();
  };
}
export function stopActiveMedia() {
  for (const stop of mediaStops) {
    try {
      stop();
    } catch {
      console.warn("Media cleanup failed");
    }
  }
}
export function resetConversation(
  clearSession: () => void,
  clearDraft: () => void,
) {
  stopActiveMedia();
  clearSession();
  clearDraft();
}

type SessionPhase = "changing" | "changed";
const sessionListeners = new Set<(phase: SessionPhase) => void>();
let channel: BroadcastChannel | undefined;
function notifySessionChange(phase: SessionPhase) {
  stopActiveMedia();
  for (const listener of sessionListeners) listener(phase);
}
function sessionChannel() {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined")
    return undefined;
  if (!channel) {
    channel = new BroadcastChannel("oknef-session-boundary");
    channel.onmessage = ({ data }) => {
      if (data !== "changing" && data !== "changed") return;
      notifySessionChange(data);
    };
  }
  return channel;
}
export function listenSessionChange(listener: (phase: SessionPhase) => void) {
  sessionListeners.add(listener);
  sessionChannel();
  return () => {
    sessionListeners.delete(listener);
  };
}
export async function sessionBoundary<T>(action: () => Promise<T>): Promise<T> {
  notifySessionChange("changing");
  sessionChannel()?.postMessage("changing");
  try {
    return await action();
  } finally {
    notifySessionChange("changed");
    sessionChannel()?.postMessage("changed");
  }
}
