import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/buttons/Button/Button";
import { startDictation } from "@/features/chat/voice";
import { usePreferences } from "@/features/preferences/Preferences";
import { useProductMessages } from "@/features/product/messages";
import type { SessionKind } from "@/features/security/contracts";
import { api } from "@/lib/api";
import { registerMediaStop } from "@/lib/mediaLifecycle";
import type { Evidence } from "./localStore";
import { analyzeMedia } from "./mediaAnalysis";

export function MediaEvidence({
  kind,
  onText,
  onEvidence,
}: {
  kind: SessionKind;
  onText: (value: string) => void;
  onEvidence: (file: File, source: Evidence["source"]) => Promise<void>;
}) {
  const m = useProductMessages();
  const { locale } = usePreferences();
  const video = useRef<HTMLVideoElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");
  const recorder = useRef<Awaited<ReturnType<typeof startDictation>> | null>(
    null,
  );
  const recordingEpoch = useRef(0);
  const recordingStarting = useRef(false);
  const mounted = useRef(true);
  const request = useRef<AbortController | null>(null);
  useEffect(() => {
    mounted.current = true;
    const stop = () => {
      request.current?.abort();
      request.current = null;
      recordingEpoch.current++;
      recordingStarting.current = false;
      recorder.current?.cancel();
      recorder.current = null;
      if (mounted.current) {
        setRecording(false);
        setPending(false);
      }
    };
    const dispose = registerMediaStop(stop);
    window.addEventListener("pagehide", stop);
    return () => {
      mounted.current = false;
      window.removeEventListener("pagehide", stop);
      dispose();
    };
  }, []);
  useEffect(() => {
    if (!file || kind !== "video") {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file, kind]);
  async function choose(value: File | undefined) {
    setError("");
    if (!value) return;
    const allowed =
      kind === "call"
        ? /^(audio\/(webm|wav|x-wav|mpeg|mp4|ogg)|video\/webm)$/
        : kind === "video"
          ? /^video\/(mp4|webm|quicktime)$/
          : /^image\/(png|jpeg)$/;
    if (
      !allowed.test(value.type) ||
      value.size >
        (kind === "video"
          ? 25_000_000
          : kind === "call"
            ? 12_000_000
            : 4_000_000)
    ) {
      setError(m.fileTooLarge);
      return;
    }
    setFile(value);
    await onEvidence(value, "upload");
  }
  async function transcribe(value: File, source: Evidence["source"]) {
    if (!mounted.current) return;
    setRecording(false);
    setPending(true);
    setError("");
    const controller = new AbortController();
    request.current = controller;
    try {
      await onEvidence(value, source);
      controller.signal.throwIfAborted();
      const form = new FormData();
      form.append("file", value);
      form.append("locale", locale);
      const result = await api(
        "/transcribe",
        z.object({ text: z.string(), model: z.string() }).strict(),
        { method: "POST", body: form, signal: controller.signal },
      );
      if (mounted.current && !controller.signal.aborted) onText(result.text);
    } catch {
      if (mounted.current && !controller.signal.aborted) setError(m.error);
    } finally {
      if (request.current === controller) {
        request.current = null;
        if (mounted.current) setPending(false);
      }
    }
  }
  async function record() {
    if (recordingStarting.current) {
      recordingEpoch.current++;
      recordingStarting.current = false;
      setRecording(false);
      return;
    }
    if (recording) {
      recorder.current?.stop();
      return;
    }
    setError("");
    const epoch = recordingEpoch.current;
    recordingStarting.current = true;
    setRecording(true);
    try {
      const handle = await startDictation((blob) => {
        if (mounted.current && recordingEpoch.current === epoch)
          void transcribe(
            new File([blob], "call-recording.webm", { type: blob.type }),
            "microphone",
          );
      });
      if (!mounted.current || recordingEpoch.current !== epoch) handle.cancel();
      else {
        recorder.current = handle;
        setRecording(true);
      }
    } catch {
      if (mounted.current && recordingEpoch.current === epoch) {
        setError(m.cameraError);
        setRecording(false);
      }
    } finally {
      if (recordingEpoch.current === epoch) recordingStarting.current = false;
    }
  }
  async function extract() {
    if (!file) return;
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    setError("");
    try {
      const text = await analyzeMedia(
        file,
        kind,
        video.current,
        locale,
        controller.signal,
      );
      if (mounted.current && !controller.signal.aborted) onText(text);
    } catch {
      if (mounted.current && !controller.signal.aborted) setError(m.error);
    } finally {
      if (request.current === controller) {
        request.current = null;
        if (mounted.current) setPending(false);
      }
    }
  }
  return (
    <section className="rounded-2xl border border-border p-4 space-y-4">
      <p className="text-xs leading-6 text-secondary">{m.mediaBoundary}</p>
      <label className="block">
        <span className="field-label">{m.upload}</span>
        <input
          className="field"
          type="file"
          disabled={pending || recording}
          accept={
            kind === "call"
              ? "audio/*"
              : kind === "video"
                ? "video/mp4,video/webm,video/quicktime"
                : "image/png,image/jpeg"
          }
          onChange={(event) =>
            void choose(event.target.files?.[0]).catch(() => setError(m.error))
          }
        />
      </label>
      {preview && (
        <video
          ref={video}
          src={preview}
          controls
          muted
          playsInline
          preload="metadata"
          className="max-h-72 w-full rounded-xl bg-rail"
          aria-label={m.videoPreview}
        />
      )}
      <label className="flex items-start gap-3 text-xs leading-6">
        <input
          type="checkbox"
          checked={consent}
          disabled={pending || recording}
          onChange={(event) => setConsent(event.target.checked)}
        />
        {m.consent}
      </label>
      <div className="flex flex-wrap gap-2">
        {kind === "call" ? (
          <>
            <Button
              type="button"
              variant="secondary"
              disabled={!consent || pending}
              onClick={record}
            >
              {recording ? m.stopRecording : m.microphone}
            </Button>
            <Button
              type="button"
              disabled={!consent || !file || pending || recording}
              onClick={() => file && transcribe(file, "upload")}
            >
              {m.transcribe}
            </Button>
          </>
        ) : (
          <Button
            type="button"
            disabled={!consent || !file || pending}
            onClick={extract}
          >
            {kind === "video" ? m.reviewFrame : m.extract}
          </Button>
        )}
      </div>
      {pending && <output className="text-xs">{m.pending}</output>}
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </section>
  );
}
