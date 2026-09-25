import {
  type VoiceActionHandler,
  type VoiceActivity,
  type VoiceMessage,
  voiceEvents,
} from "./voiceEvents";

export { startDictation } from "./dictation";
export type VoiceHandle = {
  close: () => void;
  setMuted: (muted: boolean) => void;
  sendText: (content: string) => boolean;
  addContext: (content: string) => boolean;
};
export async function startVoice(
  locale: string,
  onText: (role: "user" | "assistant", text: string) => void,
  onEnded: () => void,
  signal: AbortSignal,
  onAction?: VoiceActionHandler,
  options: {
    history?: readonly VoiceMessage[];
    onActivity?: (activity: VoiceActivity) => void;
  } = {},
): Promise<VoiceHandle> {
  signal.throwIfAborted();
  const peer = new RTCPeerConnection();
  const audio = document.createElement("audio");
  audio.autoplay = true;
  audio.setAttribute("playsinline", "");
  audio.hidden = true;
  document.body.appendChild(audio);
  let stream: MediaStream | undefined;
  let closed = false;
  let disconnectTimer: ReturnType<typeof setTimeout> | undefined;
  const session = new AbortController();
  const close = () => {
    if (closed) return;
    closed = true;
    session.abort();
    clearTimeout(disconnectTimer);
    signal.removeEventListener("abort", close);
    stream?.getTracks().forEach((track) => {
      track.stop();
    });
    peer.close();
    audio.pause();
    audio.srcObject = null;
    audio.remove();
  };
  const fail = () => {
    if (!closed) {
      close();
      onEnded();
    }
  };
  signal.addEventListener("abort", close, { once: true });
  try {
    stream = await captureMicrophone(session.signal);
    signal.throwIfAborted();
    stream.getTracks().forEach((track) => {
      // Capture starts only after the provider session and event channel are ready.
      track.enabled = false;
      track.addEventListener("ended", fail, { once: true });
      peer.addTrack(track, stream as MediaStream);
    });
    peer.ontrack = (event) => {
      audio.srcObject = event.streams[0] ?? new MediaStream([event.track]);
      audio.play().catch(fail);
    };
    const channel = peer.createDataChannel("oai-events");
    let sessionReady = false;
    const events = voiceEvents(channel, {
      onText,
      onAction,
      onActivity: options.onActivity,
      onReady: () => {
        sessionReady = true;
      },
      onError: fail,
      signal: session.signal,
    });
    channel.onerror = fail;
    channel.onclose = fail;
    channel.onmessage = (event) => events.receive(event.data);
    peer.onconnectionstatechange = () => {
      clearTimeout(disconnectTimer);
      if (closed) return;
      if (peer.connectionState === "failed") fail();
      if (peer.connectionState === "disconnected")
        disconnectTimer = setTimeout(fail, 8000);
    };
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    const response = await fetch("/api/voice/call", {
      method: "POST",
      headers: { "Content-Type": "application/sdp", "x-oknef-locale": locale },
      body: offer.sdp,
      credentials: "same-origin",
      signal: AbortSignal.any([session.signal, AbortSignal.timeout(30000)]),
    });
    if (!response.ok) throw new Error("callFailed");
    const answer = await response.text();
    if (!answer.startsWith("v=0") || answer.length > 100000)
      throw new Error("callFailed");
    await peer.setRemoteDescription({ type: "answer", sdp: answer });
    await waitForConnection(peer, channel, () => sessionReady, session.signal);
    events.restore(options.history ?? []);
    stream.getAudioTracks().forEach((track) => {
      track.enabled = true;
    });
    options.onActivity?.("listening");
    return {
      close,
      sendText: events.sendText,
      addContext: events.addContext,
      setMuted: (muted) =>
        stream?.getAudioTracks().forEach((track) => {
          track.enabled = !muted;
        }),
    };
  } catch (error) {
    close();
    throw error;
  }
}

function captureMicrophone(signal: AbortSignal): Promise<MediaStream> {
  return new Promise((resolve, reject) => {
    const abort = () =>
      reject(new DOMException("Voice cancelled", "AbortError"));
    if (signal.aborted) {
      abort();
      return;
    }
    signal.addEventListener("abort", abort, { once: true });
    navigator.mediaDevices
      .getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      })
      .then(
        (stream) => {
          signal.removeEventListener("abort", abort);
          if (signal.aborted)
            stream.getTracks().forEach((track) => {
              track.stop();
            });
          else resolve(stream);
        },
        (error: unknown) => {
          signal.removeEventListener("abort", abort);
          reject(error);
        },
      );
  });
}
function waitForConnection(
  peer: RTCPeerConnection,
  channel: RTCDataChannel,
  sessionReady: () => boolean,
  signal: AbortSignal,
) {
  return new Promise<void>((resolve, reject) => {
    const finish = (error?: Error) => {
      clearTimeout(timer);
      clearInterval(poll);
      signal.removeEventListener("abort", abort);
      if (error) reject(error);
      else resolve();
    };
    const check = () => {
      if (
        peer.connectionState === "connected" &&
        channel.readyState === "open" &&
        sessionReady()
      )
        finish();
      else if (
        ["failed", "closed"].includes(peer.connectionState) ||
        channel.readyState === "closed"
      )
        finish(new Error("callFailed"));
    };
    const abort = () => finish(new Error("callFailed"));
    const timer = setTimeout(() => finish(new Error("callFailed")), 20000);
    const poll = setInterval(check, 50);
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
    else check();
  });
}
