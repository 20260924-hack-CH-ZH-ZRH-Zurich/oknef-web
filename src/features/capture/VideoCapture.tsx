import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { observeCaptureLifecycle } from "@/features/capture/lifecycle";
import { stopActiveMedia } from "@/lib/mediaLifecycle";
import { useCaptureMessages } from "./messages";
import { recordStream } from "./recording";

export function VideoCapture({
  onCapture,
  disabled,
  face = false,
}: {
  onCapture: (file: File) => Promise<void>;
  disabled: boolean;
  face?: boolean;
}) {
  const m = useCaptureMessages();
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<ReturnType<typeof recordStream> | null>(null);
  const epoch = useRef(0);
  const mounted = useRef(true);
  const [state, setState] = useState<
    "idle" | "starting" | "recording" | "saving"
  >("idle");
  const [audio, setAudio] = useState(false);
  const [error, setError] = useState(false);
  const cancel = useCallback(() => {
    epoch.current++;
    recorder.current?.cancel();
    recorder.current = null;
    stream.current?.getTracks().forEach((track) => {
      track.stop();
    });
    stream.current = null;
    if (video.current) video.current.srcObject = null;
    if (mounted.current) setState("idle");
  }, []);
  useEffect(() => {
    mounted.current = true;
    const dispose = observeCaptureLifecycle(cancel);
    return () => {
      mounted.current = false;
      dispose();
    };
  }, [cancel]);
  async function start() {
    if (audio) stopActiveMedia();
    const current = ++epoch.current;
    setState("starting");
    setError(false);
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: face ? "user" : "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio,
      });
      if (!mounted.current || current !== epoch.current) {
        media.getTracks().forEach((track) => {
          track.stop();
        });
        return;
      }
      stream.current = media;
      if (!video.current) throw new Error("Video preview unavailable");
      video.current.srcObject = media;
      await video.current.play();
      if (current !== epoch.current) return;
      recorder.current = recordStream(
        media,
        (file) => {
          if (!mounted.current || current !== epoch.current) return;
          setState("saving");
          void onCapture(file)
            .catch(() => {
              if (mounted.current && current === epoch.current) setError(true);
            })
            .finally(() => {
              if (mounted.current && current === epoch.current) cancel();
            });
        },
        () => {
          if (mounted.current && current === epoch.current) {
            cancel();
            setError(true);
          }
        },
      );
      setState("recording");
    } catch {
      if (mounted.current && current === epoch.current) {
        cancel();
        setError(true);
      }
    }
  }
  return (
    <div className="space-y-3">
      <p className="subtext">{face ? m.faceHelp : m.videoHelp}</p>
      <video
        ref={video}
        muted
        playsInline
        aria-label={m.video}
        className={
          state === "idle" ? "hidden" : "max-h-72 w-full rounded-xl bg-rail"
        }
      />
      <label className="flex items-center gap-3 text-xs">
        <input
          type="checkbox"
          checked={audio}
          disabled={state !== "idle" || disabled}
          onChange={(event) => setAudio(event.target.checked)}
        />
        {m.includeAudio}
      </label>
      {audio && <p className="subtext">{m.microphoneHandoff}</p>}
      <div className="flex flex-wrap gap-2">
        {state === "idle" ? (
          <Button
            type="button"
            variant="secondary"
            disabled={disabled}
            onClick={start}
          >
            {m.startVideo}
          </Button>
        ) : (
          <>
            <Button
              type="button"
              disabled={state !== "recording"}
              onClick={() => recorder.current?.stop()}
            >
              {m.stopVideo}
            </Button>
            <Button type="button" variant="ghost" onClick={cancel}>
              {m.cancel}
            </Button>
          </>
        )}
      </div>
      {state === "recording" && (
        <output className="text-xs text-danger">● {m.recording}</output>
      )}
      {error && (
        <p role="alert" className="text-xs text-danger">
          {m.cameraError}
        </p>
      )}
    </div>
  );
}
