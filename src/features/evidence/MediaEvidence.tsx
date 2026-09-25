import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/buttons/Button/Button";
import { AudioCapture } from "@/features/capture/AudioCapture";
import { ImagePreview } from "@/features/capture/ImagePreview";
import { useCaptureMessages } from "@/features/capture/messages";
import { VideoCapture } from "@/features/capture/VideoCapture";
import { DocumentResult } from "@/features/chat/DocumentResult";
import type { DocumentReply } from "@/features/chat/documents";
import { usePreferences } from "@/features/preferences/Preferences";
import { useProductMessages } from "@/features/product/messages";
import { CameraCapture } from "@/features/qr/CameraCapture";
import type { SessionKind } from "@/features/security/contracts";
import { api } from "@/lib/api";
import { registerMediaStop } from "@/lib/mediaLifecycle";
import type { Evidence } from "./localStore";
import { analyzeMedia } from "./mediaAnalysis";

export function MediaEvidence({
  kind,
  onText,
  onEvidence,
  onDocument,
  onBusyChange,
}: {
  kind: SessionKind;
  onText: (value: string) => void;
  onEvidence: (file: File, source: Evidence["source"]) => Promise<void>;
  onDocument?: (value: DocumentReply | undefined) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const m = useProductMessages();
  const capture = useCaptureMessages();
  const { locale } = usePreferences();
  const video = useRef<HTMLVideoElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");
  const [prompt, setPrompt] = useState("");
  const [documentResult, setDocumentResult] = useState<DocumentReply>();
  const mounted = useRef(true);
  const request = useRef<AbortController | null>(null);
  useEffect(() => {
    onBusyChange?.(pending || recording);
  }, [pending, recording, onBusyChange]);
  useEffect(() => {
    mounted.current = true;
    const stop = () => {
      request.current?.abort();
      request.current = null;
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
    if (!file || !file.type.startsWith("video/")) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  async function choose(
    value: File | undefined,
    source: Evidence["source"] = "upload",
  ) {
    setError("");
    if (!value) return;
    const allowed =
      kind === "call"
        ? /^(audio\/(webm|wav|x-wav|mpeg|mp4|ogg)|video\/webm)$/
        : kind === "video"
          ? /^video\/(mp4|webm|quicktime)$/
          : kind === "identity"
            ? /^(image\/(png|jpeg)|video\/(mp4|webm|quicktime))$/
            : /^image\/(png|jpeg)$/;
    if (
      !allowed.test(value.type.split(";")[0]) ||
      value.size >
        (value.type.startsWith("video/") && kind !== "call"
          ? 20 * 1024 * 1024
          : kind === "call"
            ? 12_000_000
            : 4_000_000)
    ) {
      setError(m.fileTooLarge);
      return;
    }
    setPending(true);
    setFile(null);
    setDocumentResult(undefined);
    onDocument?.(undefined);
    onText("");
    try {
      await onEvidence(value, source);
      if (mounted.current) setFile(value);
    } finally {
      if (mounted.current) setPending(false);
    }
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
  async function extract() {
    if (!file) return;
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    setError("");
    try {
      const result = await analyzeMedia(
        file,
        kind,
        video.current,
        locale,
        controller.signal,
        prompt,
      );
      if (mounted.current && !controller.signal.aborted) {
        onText(result.text);
        if ("document" in result) {
          setDocumentResult(result.document);
          onDocument?.(result.document);
        }
      }
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
      {(kind === "document" || kind === "identity") && (
        <CameraCapture
          facingMode={kind === "identity" ? "user" : "environment"}
          name={kind === "identity" ? "portrait" : "document"}
          help={capture.photoHelp}
          captureLabel={capture.capturePhoto}
          disabled={pending || recording}
          onCapture={(value) => choose(value, "camera")}
        />
      )}
      {(kind === "video" || kind === "identity") && (
        <VideoCapture
          disabled={pending || recording}
          face={kind === "identity"}
          onCapture={(value) => choose(value, "camera")}
        />
      )}
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
                : kind === "identity"
                  ? "image/png,image/jpeg,video/mp4,video/webm,video/quicktime"
                  : "image/png,image/jpeg"
          }
          onChange={(event) => {
            void choose(event.target.files?.[0]).catch(() => setError(m.error));
            event.target.value = "";
          }}
        />
      </label>
      {file && (
        <p className="text-xs text-secondary">
          {capture.file}: {file.name} · {file.size} {m.bytes}
        </p>
      )}
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
      {file?.type.startsWith("image/") && (
        <ImagePreview file={file} label={capture.file} />
      )}
      {kind !== "call" && (
        <label className="block">
          <span className="field-label">{capture.prompt}</span>
          <textarea
            className="field"
            value={prompt}
            disabled={pending}
            maxLength={1000}
            rows={2}
            onChange={(event) => setPrompt(event.target.value)}
          />
          <span className="subtext">{capture.promptHelp}</span>
        </label>
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
            <AudioCapture
              disabled={!consent || pending}
              onRecordingChange={setRecording}
              onCapture={(value) => transcribe(value, "microphone")}
            />
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
            {file?.type.startsWith("video/")
              ? capture.reviewFrames
              : kind === "identity"
                ? capture.reviewVisual
                : m.extract}
          </Button>
        )}
      </div>
      {pending && <output className="text-xs">{m.pending}</output>}
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
      {documentResult && <DocumentResult result={documentResult} />}
    </section>
  );
}
