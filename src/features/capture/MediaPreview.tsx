import { useEffect, useState } from "react";

export function MediaPreview({ file, label }: { file: File; label: string }) {
  const [url, setState] = useState("");
  useEffect(() => {
    const value = URL.createObjectURL(file);
    setState(value);
    return () => URL.revokeObjectURL(value);
  }, [file]);
  if (!url) return null;
  if (file.type.startsWith("video/"))
    return (
      <video
        src={url}
        controls
        muted
        playsInline
        preload="metadata"
        aria-label={label}
        className="max-h-72 w-full rounded-xl bg-rail"
      />
    );
  if (file.type.startsWith("audio/"))
    return (
      // biome-ignore lint/a11y/useMediaCaption: this is a user file preview; the generated transcript is displayed separately after transcription.
      <audio
        src={url}
        controls
        preload="metadata"
        aria-label={label}
        className="w-full"
      />
    );
  return (
    // biome-ignore lint/performance/noImgElement: sensitive local evidence must not pass through an image proxy.
    <img
      src={url}
      alt={label}
      className="max-h-60 w-full rounded-xl object-contain"
    />
  );
}
