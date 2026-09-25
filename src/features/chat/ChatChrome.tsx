import {
  AudioLines,
  HeartHandshake,
  ImagePlus,
  Mic,
  MicOff,
  Network,
  Plus,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { usePreferences } from "@/features/preferences/Preferences";
import { useProductMessages } from "@/features/product/messages";
import type { useMedia } from "./useMedia";

type Media = ReturnType<typeof useMedia>;
export function ChatHeader({
  onNew,
  media,
}: {
  onNew: () => void;
  media: Media;
}) {
  const { t } = usePreferences();
  const m = useProductMessages();
  return (
    <header className="flex items-center justify-between border-b border-border pb-5">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-good" />
        <h1 className="text-sm font-semibold">{t("assistant")}</h1>
        <span className="tag hidden sm:inline-flex">{t("providerOnly")}</span>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className="icon-button"
          title={t("newChat")}
          aria-label={t("newChat")}
          onClick={onNew}
        >
          <Plus size={17} />
        </button>
        <button
          type="button"
          className={`icon-button ${media.muted ? "bg-danger-soft text-danger" : ""}`}
          aria-label={media.muted ? m.unmute : m.mute}
          title={media.muted ? m.unmute : m.mute}
          disabled={media.voiceState !== "live"}
          aria-pressed={media.muted}
          onClick={media.toggleMute}
        >
          {media.muted ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
        <button
          type="button"
          className={`icon-button ${media.voiceState !== "off" ? "bg-accent text-accent-ink" : ""}`}
          title={t(media.voiceState === "off" ? "voice" : "endVoice")}
          aria-label={t(media.voiceState === "off" ? "voice" : "endVoice")}
          disabled={media.recording}
          onClick={media.toggleVoice}
        >
          <AudioLines size={18} />
        </button>
      </div>
    </header>
  );
}
export function ChatCommands({
  onChoose,
}: {
  onChoose: (command: string) => void;
}) {
  const m = useProductMessages();
  return (
    <details className="my-3 text-xs text-secondary">
      <summary className="cursor-pointer">/ · @ · {m.context}</summary>
      <p className="mt-2 leading-6">{m.commandHelp}</p>
      <p className="mt-2 leading-6">{m.contextHelp}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {[
          "/qr",
          "/call",
          "/video",
          "/identity",
          "/plan",
          "@assets",
          "@sessions",
          "@integrations",
        ].map((command) => (
          <button
            type="button"
            key={command}
            className="rounded-full border border-border px-3 py-1.5"
            onClick={() => onChoose(command)}
          >
            {command}
          </button>
        ))}
      </div>
    </details>
  );
}
export function ChatWelcome({
  onChoose,
}: {
  onChoose: (prompt: string, image: boolean) => void;
}) {
  const { t } = usePreferences();
  const suggestions = [
    { label: "suggestion1", prompt: "prompt1", icon: ShieldCheck },
    { label: "suggestion2", prompt: "prompt2", icon: HeartHandshake },
    { label: "suggestion3", prompt: "prompt3", icon: Network },
    { label: "suggestion4", prompt: "prompt4", icon: ImagePlus },
  ] as const;
  return (
    <div className="my-auto py-16 text-center">
      <div className="mx-auto mb-7 flex size-16 items-center justify-center rounded-2xl bg-accent/25 text-good">
        <Sparkles size={28} strokeWidth={1.3} />
      </div>
      <h2 className="mx-auto max-w-xl text-3xl font-medium leading-tight tracking-tight md:text-4xl">
        {t("chatTitle")}
      </h2>
      <p className="subtext mx-auto mt-4 max-w-lg">{t("chatBody")}</p>
      <div className="mx-auto mt-9 grid max-w-xl gap-3 text-left sm:grid-cols-2">
        {suggestions.map(({ label, prompt, icon: Icon }, i) => (
          <button
            type="button"
            key={label}
            onClick={() => onChoose(t(prompt), i === 3)}
            className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-xs text-secondary transition hover:border-good/40 hover:text-foreground"
          >
            <Icon size={18} className="shrink-0 text-good" />
            {t(label)}
          </button>
        ))}
      </div>
    </div>
  );
}
export function VoiceStatus({ media }: { media: Media }) {
  const { t } = usePreferences();
  const m = useProductMessages();
  if (media.voiceState === "off") return null;
  return (
    <output className="mb-3 flex items-center gap-3 rounded-2xl bg-accent/20 p-4 text-sm">
      <AudioLines size={20} className="animate-pulse text-good" />
      <div>
        <p>
          {t(
            media.voiceState === "connecting" ? "voiceConnecting" : "voiceLive",
          )}
        </p>
        <p className="mt-1 text-xs text-secondary">
          {t("voiceDisclaimer")} {media.muted ? m.muted : m.listening}
        </p>
      </div>
      <button
        type="button"
        className="icon-button ml-auto"
        aria-label={t("endVoice")}
        title={t("endVoice")}
        onClick={media.toggleVoice}
      >
        <X size={16} />
      </button>
    </output>
  );
}
