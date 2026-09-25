import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import type { Locale } from "@/features/preferences/Preferences";
import { api } from "@/lib/api";
import type { TranslationKey } from "@/lib/i18n/en";
import { registerMediaStop } from "@/lib/mediaLifecycle";
import type { VoiceAction } from "./commands";
import { startDictation, startVoice, type VoiceHandle } from "./voice";
export function useMedia(
  locale: Locale,
  onVoice: (role: "user" | "assistant", content: string) => void,
  onText: (text: string) => void,
  onAction?: (action: VoiceAction) => void,
) {
  const [voiceState, setVoiceState] = useState<"off" | "connecting" | "live">(
    "off",
  );
  const [muted, setMuted] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<TranslationKey | null>(null);
  const voice = useRef<VoiceHandle | null>(null);
  const dictation = useRef<Awaited<ReturnType<typeof startDictation>> | null>(
    null,
  );
  const dictationStarting = useRef(false);
  const generation = useRef(0);
  const transcription = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const attempt = useRef<AbortController | null>(null);
  const endVoice = useCallback(() => {
    generation.current++;
    attempt.current?.abort();
    attempt.current = null;
    voice.current?.close();
    voice.current = null;
    transcription.current?.abort();
    transcription.current = null;
    dictation.current?.cancel();
    dictation.current = null;
    dictationStarting.current = false;
    if (mounted.current) {
      setVoiceState("off");
      setMuted(false);
      setRecording(false);
      setTranscribing(false);
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    const dispose = registerMediaStop(endVoice);
    window.addEventListener("pagehide", endVoice);
    return () => {
      mounted.current = false;
      window.removeEventListener("pagehide", endVoice);
      dispose();
    };
  }, [endVoice]);
  async function toggleVoice() {
    if (attempt.current || voice.current) {
      endVoice();
      return;
    }
    setError(null);
    setMuted(false);
    setVoiceState("connecting");
    const controller = new AbortController();
    attempt.current = controller;
    try {
      const call = await startVoice(
        locale,
        onVoice,
        () => {
          if (
            mounted.current &&
            attempt.current === controller &&
            !controller.signal.aborted
          ) {
            attempt.current = null;
            voice.current = null;
            setVoiceState("off");
            setError("callFailed");
          }
        },
        controller.signal,
        onAction,
      );
      if (
        !mounted.current ||
        controller.signal.aborted ||
        attempt.current !== controller
      ) {
        call.close();
        return;
      }
      voice.current = call;
      setVoiceState("live");
    } catch (reason) {
      if (
        !mounted.current ||
        controller.signal.aborted ||
        attempt.current !== controller
      )
        return;
      attempt.current = null;
      setVoiceState("off");
      setError(
        reason instanceof DOMException && reason.name === "NotAllowedError"
          ? "microphoneDenied"
          : "callFailed",
      );
    }
  }
  async function transcribe(blob: Blob, epoch: number) {
    if (!mounted.current || generation.current !== epoch) return;
    setRecording(false);
    setTranscribing(true);
    const request = new AbortController();
    transcription.current = request;
    try {
      if (blob.size > 12000000) {
        setError("fileTooLarge");
        return;
      }
      const data = new FormData();
      data.append(
        "file",
        blob,
        blob.type.includes("mp4") ? "voice.m4a" : "voice.webm",
      );
      data.append("locale", locale);
      const result = await api(
        "/transcribe",
        z.object({ text: z.string(), model: z.string() }).strict(),
        { method: "POST", body: data, signal: request.signal },
      );
      if (
        mounted.current &&
        !request.signal.aborted &&
        generation.current === epoch
      )
        onText(result.text);
    } catch {
      if (
        mounted.current &&
        !request.signal.aborted &&
        generation.current === epoch
      )
        setError("providerError");
    } finally {
      if (transcription.current === request) {
        transcription.current = null;
        if (mounted.current) setTranscribing(false);
      }
    }
  }
  async function toggleRecording() {
    if (dictationStarting.current) {
      endVoice();
      return;
    }
    if (recording) {
      dictation.current?.stop();
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      setError("voiceUnsupported");
      return;
    }
    setError(null);
    setRecording(true);
    dictationStarting.current = true;
    const epoch = generation.current;
    try {
      const handle = await startDictation(
        (blob) => void transcribe(blob, epoch),
      );
      if (!mounted.current || generation.current !== epoch) {
        handle.cancel();
        return;
      }
      dictation.current = handle;
    } catch {
      if (mounted.current && generation.current === epoch) {
        setRecording(false);
        setError("microphoneDenied");
      }
    } finally {
      if (generation.current === epoch) dictationStarting.current = false;
    }
  }
  return {
    voiceState,
    muted,
    toggleMute: () => {
      const next = !muted;
      voice.current?.setMuted(next);
      setMuted(next);
    },
    recording,
    transcribing,
    error,
    toggleVoice,
    endVoice,
    toggleRecording,
  };
}
