export function sampleTimes(duration: number) {
  if (!Number.isFinite(duration) || duration <= 0)
    throw new Error("Video duration unavailable");
  return [0.1, 0.5, 0.9].map((part) => duration * part);
}

function waitFor(video: HTMLVideoElement, event: string, signal: AbortSignal) {
  signal.throwIfAborted();
  return new Promise<void>((resolve, reject) => {
    const clear = () => {
      clearTimeout(timer);
      video.removeEventListener(event, done);
      video.removeEventListener("error", failed);
      signal.removeEventListener("abort", aborted);
    };
    const done = () => {
      clear();
      resolve();
    };
    const failed = () => {
      clear();
      reject(new Error("Video frame unavailable"));
    };
    const aborted = () => {
      clear();
      reject(signal.reason);
    };
    const timer = setTimeout(failed, 10000);
    video.addEventListener(event, done, { once: true });
    video.addEventListener("error", failed, { once: true });
    signal.addEventListener("abort", aborted, { once: true });
  });
}

async function seek(
  video: HTMLVideoElement,
  time: number,
  signal: AbortSignal,
) {
  if (Math.abs(video.currentTime - time) < 0.001 && video.readyState >= 2)
    return;
  const ready = waitFor(video, "seeked", signal);
  video.currentTime = time;
  await ready;
}

export async function sampleVideoFrames(file: File, signal: AbortSignal) {
  const video = document.createElement("video");
  const url = URL.createObjectURL(file);
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  try {
    const loaded = waitFor(video, "loadeddata", signal);
    video.src = url;
    await loaded;
    // Browser-recorded WebM may omit a duration. Seeking to the end resolves it.
    if (!Number.isFinite(video.duration))
      await seek(video, Number.MAX_SAFE_INTEGER, signal);
    const times = sampleTimes(video.duration);
    const scale = Math.min(
      1,
      1280 / Math.max(video.videoWidth, video.videoHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const context = canvas.getContext("2d");
    if (!context || !video.videoWidth)
      throw new Error("Video pixels unavailable");
    const images: string[] = [];
    for (const time of times) {
      await seek(video, time, signal);
      signal.throwIfAborted();
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      images.push(canvas.toDataURL("image/jpeg", 0.8));
    }
    return images;
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}
