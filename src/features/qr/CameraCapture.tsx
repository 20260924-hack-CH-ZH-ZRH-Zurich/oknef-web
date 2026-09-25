import { Camera, CameraOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { useProductMessages } from "@/features/product/messages";
export function CameraCapture({
  onCapture,
}: {
  onCapture: (file: File) => Promise<void>;
}) {
  const m = useProductMessages();
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const generation = useRef(0);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  function stop() {
    generation.current++;
    stream.current?.getTracks().forEach((track) => {
      track.stop();
    });
    stream.current = null;
    setActive(false);
  }
  useEffect(
    () => () => {
      generation.current++;
      stream.current?.getTracks().forEach((track) => {
        track.stop();
      });
    },
    [],
  );
  async function start() {
    setError(false);
    setBusy(true);
    const current = ++generation.current;
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
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
      stop();
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  async function capture() {
    if (!video.current?.videoWidth) return;
    setBusy(true);
    setError(false);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.current.videoWidth;
      canvas.height = video.current.videoHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("canvas unavailable");
      context.drawImage(video.current, 0, 0);
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (value) =>
            value ? resolve(value) : reject(new Error("capture failed")),
          "image/png",
        ),
      );
      await onCapture(new File([blob], "qr-camera.png", { type: "image/png" }));
      stop();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-3">
      <p className="subtext">{m.cameraHelp}</p>
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
          disabled={busy}
          onClick={active ? stop : start}
        >
          {active ? <CameraOff size={16} /> : <Camera size={16} />}
          {active ? m.stopCamera : m.capture}
        </Button>
        {active && (
          <Button type="button" disabled={busy} onClick={capture}>
            {m.takePhoto}
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
