import { useEffect, useState } from "react";

export function ImagePreview({ file, label }: { file: File; label: string }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const value = URL.createObjectURL(file);
    setUrl(value);
    return () => URL.revokeObjectURL(value);
  }, [file]);
  return url ? (
    // biome-ignore lint/performance/noImgElement: sensitive local evidence must not pass through an image proxy.
    <img
      src={url}
      alt={label}
      className="max-h-60 w-full rounded-xl object-contain"
    />
  ) : null;
}
