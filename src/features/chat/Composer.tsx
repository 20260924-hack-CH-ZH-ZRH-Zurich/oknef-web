import { ArrowUp, ImagePlus, Mic, Square, Users, X } from "lucide-react";
import type { Ref } from "react";
import { usePreferences } from "@/features/preferences/Preferences";
import { DocumentUpload } from "./DocumentUpload";
import { inputLimitText } from "./limits";
import { workflowLabels } from "./workflowLabels";
import { type Workflow, workflowText } from "./workflows";
export function Composer({
  extract,
  input,
  inputTooLong,
  setInput,
  workflow,
  setWorkflow,
  imageMode,
  setImageMode,
  models,
  model,
  setModel,
  inputRef,
  pending,
  send,
  stop,
  recording,
  transcribing,
  voiceState,
  toggleRecording,
}: {
  extract: (image: string, prompt: string) => void;
  input: string;
  inputTooLong: boolean;
  setInput: (value: string) => void;
  workflow: Workflow | null;
  setWorkflow: (value: Workflow | null) => void;
  imageMode: boolean;
  setImageMode: (value: boolean) => void;
  models: string[];
  model: string;
  setModel: (value: string) => void;
  inputRef: Ref<HTMLTextAreaElement>;
  pending: "chat" | "image" | "review" | "document" | null;
  send: () => void;
  stop: () => void;
  recording: boolean;
  transcribing: boolean;
  voiceState: string;
  toggleRecording: () => void;
}) {
  const { t, locale } = usePreferences();
  const words = workflowText[locale];
  return (
    <div className="sticky bottom-0 mt-auto bg-background pb-2 pt-4">
      <div className="rounded-3xl border border-border bg-surface p-4 shadow-card">
        {workflow && (
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-good">
            <Users size={14} />
            <select
              aria-label={words.mode}
              className="bg-transparent"
              value={workflow}
              onChange={(event) => setWorkflow(event.target.value as Workflow)}
            >
              {Object.entries(workflowLabels[locale]).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <span className="ml-auto text-secondary">{input.length}/5000</span>
            <button
              type="button"
              title={t("cancel")}
              aria-label={t("cancel")}
              onClick={() => setWorkflow(null)}
            >
              <X size={13} />
            </button>
          </div>
        )}
        {imageMode && (
          <div className="mb-3 flex items-center gap-2 text-xs text-good">
            <ImagePlus size={14} />
            {t("imageMode")}
            <button
              type="button"
              onClick={() => setImageMode(false)}
              title={t("cancel")}
              aria-label={t("cancel")}
            >
              <X size={13} />
            </button>
          </div>
        )}
        <textarea
          ref={inputRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              send();
            }
          }}
          className="max-h-48 min-h-16 w-full resize-y bg-transparent px-1 py-2 text-sm leading-6 outline-none placeholder:text-secondary"
          rows={2}
          maxLength={workflow ? 5000 : 12000}
          aria-label={t("chatPlaceholder")}
          aria-invalid={inputTooLong}
          aria-describedby={inputTooLong ? "message-limit" : undefined}
          placeholder={
            workflow
              ? words.hint
              : t(imageMode ? "imageHint" : "chatPlaceholder")
          }
        />
        {inputTooLong && (
          <p
            id="message-limit"
            role="alert"
            className="mb-3 text-xs text-danger"
          >
            {inputLimitText[locale]}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <DocumentUpload disabled={Boolean(pending)} onExtract={extract} />
          <button
            type="button"
            className={`icon-button size-8 border-transparent ${imageMode ? "bg-accent/30 text-good" : ""}`}
            title={t("imageMode")}
            aria-label={t("imageMode")}
            onClick={() => setImageMode(!imageMode)}
          >
            <ImagePlus size={17} />
          </button>
          <button
            type="button"
            className={`icon-button size-8 border-transparent ${workflow ? "bg-accent/30 text-good" : ""}`}
            title={words.mode}
            aria-label={words.mode}
            onClick={() => setWorkflow(workflow ? null : "legacy-review")}
          >
            <Users size={17} />
          </button>
          <button
            type="button"
            className={`icon-button size-8 border-transparent ${recording ? "bg-danger-soft text-danger" : ""}`}
            title={t(recording ? "stopRecording" : "dictation")}
            aria-label={t(recording ? "stopRecording" : "dictation")}
            disabled={transcribing || voiceState !== "off"}
            onClick={toggleRecording}
          >
            {recording ? <Square size={15} /> : <Mic size={17} />}
          </button>
          {(recording || transcribing) && (
            <output className="text-xs text-secondary">
              {t(recording ? "recording" : "transcribing")}
            </output>
          )}
          <select
            disabled={Boolean(workflow)}
            aria-label={t("model")}
            title={t("model")}
            value={model}
            onChange={(event) => setModel(event.target.value)}
            className="ml-auto max-w-40 bg-transparent px-2 text-xs text-secondary"
          >
            <option value="auto">{t("auto")}</option>
            {models
              .filter((value) => value !== "auto")
              .map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
          </select>
          <button
            type="button"
            aria-label={t(pending ? "stop" : "send")}
            title={t(pending ? "stop" : "send")}
            onClick={pending ? stop : send}
            disabled={
              !pending &&
              (!input.trim() ||
                inputTooLong ||
                Boolean(workflow && input.length > 5000))
            }
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background"
          >
            {pending ? <Square size={15} /> : <ArrowUp size={18} />}
          </button>
        </div>
      </div>
      <p className="mt-3 text-center text-[.65rem] leading-5 text-secondary">
        {t("chatHint")} <span title={t("consentAI")}>{t("noSecrets")}</span>
      </p>
    </div>
  );
}
