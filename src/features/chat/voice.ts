import { parseVoiceAction, type VoiceAction } from "./commands";
export type VoiceHandle = {
  close: () => void;
  setMuted: (muted: boolean) => void;
};
export async function startVoice(
  locale: string,
  onText: (role: "user" | "assistant", text: string) => void,
  onEnded: () => void,
  signal: AbortSignal,
  onAction?: (action: VoiceAction) => void,
): Promise<VoiceHandle> {
  const peer = new RTCPeerConnection();
  const audio = document.createElement("audio");
  audio.autoplay = true;
  audio.hidden = true;
  document.body.appendChild(audio);
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });
  } catch (error) {
    peer.close();
    audio.remove();
    throw error;
  }
  let closed = false;
  let disconnectTimer: ReturnType<typeof setTimeout> | undefined;
  const close = () => {
    if (closed) return;
    closed = true;
    clearTimeout(disconnectTimer);
    signal.removeEventListener("abort", close);
    stream.getTracks().forEach((track) => {
      track.stop();
    });
    peer.close();
    audio.pause();
    audio.srcObject = null;
    audio.remove();
  };
  signal.addEventListener("abort", close, { once: true });
  try {
    signal.throwIfAborted();
    stream.getTracks().forEach((track) => {
      peer.addTrack(track, stream);
    });
    peer.ontrack = (event) => {
      audio.srcObject = event.streams[0];
      audio.play().catch(() => {
        if (!closed) {
          close();
          onEnded();
        }
      });
    };
    const channel = peer.createDataChannel("oai-events");
    channel.onerror = () => {
      if (!closed) {
        close();
        onEnded();
      }
    };
    channel.onclose = () => {
      if (!closed) {
        close();
        onEnded();
      }
    };
    channel.onmessage = (event) => {
      if (closed || signal.aborted) return;
      try {
        const value: unknown = JSON.parse(event.data);
        if (!value || typeof value !== "object") return;
        const message = value as Record<string, unknown>;
        if (message.type === "response.function_call_arguments.done") {
          const action = parseVoiceAction(message.name, message.arguments);
          if (action) onAction?.(action);
          if (
            typeof message.call_id === "string" &&
            channel.readyState === "open"
          ) {
            channel.send(
              JSON.stringify({
                type: "conversation.item.create",
                item: {
                  type: "function_call_output",
                  call_id: message.call_id,
                  output: JSON.stringify({
                    opened: Boolean(action && onAction),
                    submitted: false,
                  }),
                },
              }),
            );
            channel.send(JSON.stringify({ type: "response.create" }));
          }
        }
        if (
          typeof message.transcript === "string" &&
          [
            "conversation.item.input_audio_transcription.completed",
            "response.output_audio_transcript.done",
            "response.audio_transcript.done",
          ].includes(String(message.type))
        )
          onText(
            message.type ===
              "conversation.item.input_audio_transcription.completed"
              ? "user"
              : "assistant",
            message.transcript.slice(0, 30000),
          );
      } catch {
        console.warn("Invalid voice event ignored");
      }
    };
    peer.onconnectionstatechange = () => {
      clearTimeout(disconnectTimer);
      if (closed) return;
      if (peer.connectionState === "failed") {
        close();
        onEnded();
      }
      if (peer.connectionState === "disconnected")
        disconnectTimer = setTimeout(() => {
          close();
          onEnded();
        }, 8000);
    };
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    const response = await fetch("/api/voice/call", {
      method: "POST",
      headers: { "Content-Type": "application/sdp", "x-oknef-locale": locale },
      body: offer.sdp,
      credentials: "same-origin",
      signal: AbortSignal.any([signal, AbortSignal.timeout(30000)]),
    });
    if (!response.ok) throw new Error("callFailed");
    const answer = await response.text();
    if (!answer.startsWith("v=0") || answer.length > 100000)
      throw new Error("callFailed");
    await peer.setRemoteDescription({ type: "answer", sdp: answer });
    await waitForConnection(peer, signal);
    return {
      close,
      setMuted: (muted) => {
        stream.getAudioTracks().forEach((track) => {
          track.enabled = !muted;
        });
      },
    };
  } catch (error) {
    close();
    throw error;
  }
}
function waitForConnection(peer: RTCPeerConnection, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const finish = (error?: Error) => {
      clearTimeout(timer);
      peer.removeEventListener("connectionstatechange", check);
      signal.removeEventListener("abort", abort);
      if (error) reject(error);
      else resolve();
    };
    const check = () => {
      if (peer.connectionState === "connected") finish();
      else if (["failed", "closed"].includes(peer.connectionState))
        finish(new Error("callFailed"));
    };
    const abort = () => finish(new Error("callFailed"));
    const timer = setTimeout(() => finish(new Error("callFailed")), 20000);
    peer.addEventListener("connectionstatechange", check);
    signal.addEventListener("abort", abort, { once: true });
    check();
  });
}
export async function startDictation(onStop: (blob: Blob) => void) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find(
    (type) => MediaRecorder.isTypeSupported(type),
  );
  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  } catch (error) {
    stream.getTracks().forEach((track) => {
      track.stop();
    });
    throw error;
  }
  const chunks: BlobPart[] = [];
  let stopped = false;
  let discarded = false;
  let released = false;
  const releaseTracks = () => {
    if (released) return;
    released = true;
    stream.getTracks().forEach((track) => {
      track.stop();
    });
  };
  recorder.ondataavailable = (event) => {
    if (event.data.size) chunks.push(event.data);
  };
  const timer = setTimeout(() => stop(), 60000);
  const stop = () => {
    if (stopped) return;
    stopped = true;
    clearTimeout(timer);
    try {
      if (recorder.state !== "inactive") recorder.stop();
    } finally {
      releaseTracks();
    }
  };
  recorder.onstop = () => {
    stopped = true;
    clearTimeout(timer);
    releaseTracks();
    if (!discarded) onStop(new Blob(chunks, { type: recorder.mimeType }));
  };
  try {
    recorder.start();
  } catch (error) {
    discarded = true;
    clearTimeout(timer);
    releaseTracks();
    throw error;
  }
  return {
    stop,
    cancel: () => {
      discarded = true;
      stop();
    },
  };
}
