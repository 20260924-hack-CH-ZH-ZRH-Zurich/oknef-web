import { Camera, CameraOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { observeCaptureLifecycle } from "@/features/capture/lifecycle";
import { useProductMessages } from "@/features/product/messages";
export function CameraCapture({
  onCapture,
  facingMode = "environment",
  name = "qr-camera",
  disabled = false,
  help,
  captureLabel,
  onActiveChange,
}: {
  onCapture: (file: File) => Promise<void>;
  facingMode?: "environment" | "user";
  name?: string;
  disabled?: boolean;
  help?: string;
  captureLabel?: string;
  onActiveChange?: (active: boolean) => void;
}) {
  const m = useProductMessages();
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const generation = useRef(0);
  const mounted = useRef(true);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    onActiveChange?.(active || busy);
  }, [active, busy, onActiveChange]);
  const stop = useCallback(() => {
    generation.current++;
    stream.current?.getTracks().forEach((track) => {
      track.stop();
    });
    stream.current = null;
    if (video.current) video.current.srcObject = null;
    if (mounted.current) {
      setActive(false);
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    const dispose = observeCaptureLifecycle(stop);
    return () => {
      mounted.current = false;
      dispose();
    };
  }, [stop]);
  async function start() {
    setError(false);
    setBusy(true);
    const current = ++generation.current;
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      if (current !== generation.current) {
        media.getTracks().forEach((track) => {
          track.stop();
        });
        return;
      }
      stream.current = media;
      setActive(true);
      if (video.current) {
        video.current.srcObject = media;
        await video.current.play();
      }
    } catch {
      if (current === generation.current) {
        stop();
        if (mounted.current) setError(true);
      }
    } finally {
      if (mounted.current && current === generation.current) setBusy(false);
    }
  }
  async function capture() {
    if (!video.current?.videoWidth) return;
    setBusy(true);
    setError(false);
    const current = generation.current;
    try {
      const canvas = document.createElement("canvas");
      const scale = Math.min(
        1,
        1600 / Math.max(video.current.videoWidth, video.current.videoHeight),
      );
      canvas.width = Math.round(video.current.videoWidth * scale);
      canvas.height = Math.round(video.current.videoHeight * scale);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("canvas unavailable");
      context.drawImage(video.current, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (value) =>
            value ? resolve(value) : reject(new Error("capture failed")),
          name === "qr-camera" ? "image/png" : "image/jpeg",
          0.9,
        ),
      );
      if (!mounted.current || current !== generation.current) return;
      await onCapture(
        new File(
          [blob],
          `${name}.${blob.type === "image/png" ? "png" : "jpg"}`,
          { type: blob.type },
        ),
      );
      stop();
    } catch {
      if (mounted.current && current === generation.current) setError(true);
    } finally {
      if (mounted.current && current === generation.current) setBusy(false);
    }
  }
  return (
    <div className="space-y-3">
      <p className="subtext">{help || m.cameraHelp}</p>
      <video
        ref={video}
        muted
        playsInline
        aria-label={m.capture}
        className={active ? "max-h-72 w-full rounded-xl bg-rail" : "hidden"}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={disabled && !active && !busy}
          onClick={active || busy ? stop : start}
        >
          {active ? <CameraOff size={16} /> : <Camera size={16} />}
          {active || busy ? m.stopCamera : m.capture}
        </Button>
        {active && (
          <Button type="button" disabled={busy || disabled} onClick={capture}>
            {captureLabel || m.takePhoto}
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {m.cameraError}
        </p>
      )}
    </div>
  );
}
