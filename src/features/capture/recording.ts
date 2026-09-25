export const MAX_CAPTURE_BYTES = 20 * 1024 * 1024;
export const MAX_CAPTURE_SECONDS = 30;

export function videoRecordingType(supported: (type: string) => boolean) {
  return ["video/webm;codecs=vp8,opus", "video/webm", "video/mp4"].find(
    supported,
  );
}

export function recordStream(
  stream: MediaStream,
  onComplete: (file: File) => void,
  onError: () => void,
) {
  const mimeType = videoRecordingType((type) =>
    MediaRecorder.isTypeSupported(type),
  );
  const recorder = new MediaRecorder(stream, {
    ...(mimeType ? { mimeType } : {}),
    videoBitsPerSecond: 2_000_000,
  });
  let chunks: Blob[] = [];
  let size = 0;
  let cancelled = false;
  let completed = false;
  const release = () =>
    stream.getTracks().forEach((track) => {
      track.stop();
    });
  const stop = () => {
    clearTimeout(timer);
    if (recorder.state !== "inactive") recorder.stop();
    release();
  };
  recorder.ondataavailable = ({ data }) => {
    if (cancelled || !data.size) return;
    size += data.size;
    if (size > MAX_CAPTURE_BYTES) {
      cancelled = true;
      chunks = [];
      stop();
      onError();
    } else chunks.push(data);
  };
  recorder.onstop = () => {
    clearTimeout(timer);
    release();
    if (cancelled || completed) return;
    completed = true;
    const blob = new Blob(chunks, {
      type: recorder.mimeType || chunks[0]?.type,
    });
    chunks = [];
    if (!blob.size) return onError();
    const extension = blob.type.startsWith("video/mp4") ? "mp4" : "webm";
    onComplete(
      new File([blob], `video-${Date.now()}.${extension}`, {
        type: blob.type.split(";")[0],
      }),
    );
  };
  recorder.onerror = () => {
    if (cancelled || completed) return;
    cancelled = true;
    chunks = [];
    stop();
    onError();
  };
  const timer = setTimeout(stop, MAX_CAPTURE_SECONDS * 1000);
  try {
    recorder.start(1000);
  } catch (error) {
    clearTimeout(timer);
    release();
    throw error;
  }
  return {
    stop,
    cancel() {
      cancelled = true;
      chunks = [];
      stop();
    },
  };
}
