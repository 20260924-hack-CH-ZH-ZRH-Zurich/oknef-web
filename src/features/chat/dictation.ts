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
