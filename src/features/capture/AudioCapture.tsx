import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { observeCaptureLifecycle } from "@/features/capture/lifecycle";
import { startDictation } from "@/features/chat/voice";
import { useProductMessages } from "@/features/product/messages";
import { stopActiveMedia } from "@/lib/mediaLifecycle";
import { useCaptureMessages } from "./messages";

export function AudioCapture({
  disabled,
  onCapture,
  onRecordingChange,
}: {
  disabled: boolean;
  onCapture: (file: File) => Promise<void>;
  onRecordingChange: (recording: boolean) => void;
}) {
  const m = useProductMessages();
  const capture = useCaptureMessages();
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState(false);
  const handle = useRef<Awaited<ReturnType<typeof startDictation>> | null>(
    null,
  );
  const epoch = useRef(0);
  const starting = useRef(false);
  const mounted = useRef(true);
  const cancel = useCallback(() => {
    epoch.current++;
    starting.current = false;
    handle.current?.cancel();
    handle.current = null;
    if (mounted.current) setRecording(false);
  }, []);
  useEffect(() => {
    onRecordingChange(recording);
  }, [recording, onRecordingChange]);
  useEffect(() => {
    mounted.current = true;
    const dispose = observeCaptureLifecycle(cancel);
    return () => {
      mounted.current = false;
      dispose();
    };
  }, [cancel]);
  async function record() {
    if (starting.current) return cancel();
    if (recording) return handle.current?.stop();
    stopActiveMedia();
    const current = ++epoch.current;
    starting.current = true;
    setRecording(true);
    setError(false);
    try {
      const result = await startDictation((blob) => {
        if (!mounted.current || current !== epoch.current) return;
        setRecording(false);
        const extension = blob.type.startsWith("audio/mp4") ? "m4a" : "webm";
        void onCapture(
          new File([blob], `audio-${Date.now()}.${extension}`, {
            type: blob.type.split(";")[0],
          }),
        ).catch(() => {
          if (mounted.current && current === epoch.current) setError(true);
        });
      });
      if (!mounted.current || current !== epoch.current) result.cancel();
      else handle.current = result;
    } catch {
      if (mounted.current && current === epoch.current) {
        setError(true);
        setRecording(false);
      }
    } finally {
      if (current === epoch.current) starting.current = false;
    }
  }
  return (
    <div className="space-y-2">
      <p className="subtext">{capture.microphoneHandoff}</p>
      <Button
        type="button"
        variant="secondary"
        disabled={disabled && !recording}
        onClick={record}
      >
        {recording ? m.stopRecording : m.microphone}
      </Button>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {m.cameraError}
        </p>
      )}
    </div>
  );
}
