import { Paperclip } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { Dialog } from "@/components/ui/overlays/Dialog/Dialog";
import { usePreferences } from "@/features/preferences/Preferences";
import { documentText } from "./documents";
export function DocumentUpload({
  disabled,
  onExtract,
}: {
  disabled: boolean;
  onExtract: (image: string, prompt: string) => void;
}) {
  const { locale } = usePreferences();
  const text = documentText[locale];
  const input = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState("");
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState(false);
  async function choose(file: File | undefined) {
    setError(false);
    if (!file) return;
    if (
      !["image/png", "image/jpeg"].includes(file.type) ||
      file.size > 4_000_000
    ) {
      setError(true);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImage(String(reader.result));
      setPrompt("");
    };
    reader.onerror = () => setError(true);
    reader.readAsDataURL(file);
  }
  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={(event) => {
          choose(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <button
        type="button"
        className="icon-button size-8 border-transparent"
        disabled={disabled}
        title={text.upload}
        aria-label={text.upload}
        onClick={() => input.current?.click()}
      >
        <Paperclip size={17} />
      </button>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {text.error}
        </p>
      )}
      <Dialog
        open={Boolean(image)}
        onClose={() => setImage("")}
        title={text.title}
        closeLabel={text.cancel}
      >
        <p className="subtext mb-4">{text.body}</p>
        {image && (
          // biome-ignore lint/performance/noImgElement: local sensitive preview must not be sent through an image optimization proxy.
          <img
            src={image}
            alt={text.title}
            className="max-h-48 w-full rounded-xl object-contain"
          />
        )}
        <label className="mt-5 block">
          <span className="field-label">{text.prompt}</span>
          <textarea
            className="field"
            value={prompt}
            maxLength={1000}
            onChange={(event) => setPrompt(event.target.value)}
          />
        </label>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={() => setImage("")}>
            {text.cancel}
          </Button>
          <Button
            onClick={() => {
              onExtract(image, prompt);
              setImage("");
            }}
          >
            {text.send}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
