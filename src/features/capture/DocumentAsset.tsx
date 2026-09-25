import { useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import type { DocumentReply } from "@/features/chat/documents";
import { api, assetSchema, mutation } from "@/lib/api";
import { useCaptureMessages } from "./messages";
import { truncateUtf8 } from "./sessionCapture";
import { useCaptureBoundary } from "./useCaptureBoundary";

export function documentNotes(document: DocumentReply) {
  return truncateUtf8(
    [
      document.summary,
      ...document.fields.map((field) => `${field.name}: ${field.value}`),
      ...document.warnings,
    ].join("\n"),
    1900,
  );
}

export function DocumentAsset({
  sessionId,
  document,
  defaultName,
  onDone,
}: {
  sessionId: string;
  document: DocumentReply;
  defaultName: string;
  onDone: () => void;
}) {
  const m = useCaptureMessages();
  const boundary = useCaptureBoundary();
  const [name, setName] = useState(defaultName);
  const [notes, setNotes] = useState(documentNotes(document));
  const [confirmed, setConfirmed] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  async function save() {
    if (!confirmed || !name.trim() || status === "saving" || status === "saved")
      return;
    setStatus("saving");
    const { epoch, controller } = boundary.current;
    try {
      await api(
        `/security/sessions/${encodeURIComponent(sessionId)}/assets`,
        assetSchema,
        {
          ...mutation("POST", {
            name: name.trim(),
            category: "document",
            institution: "",
            value: 0,
            currency: "CHF",
            notes: truncateUtf8(notes.trim(), 2000),
            beneficiary: "",
          }),
          signal: controller.signal,
        },
      );
      if (boundary.current.mounted && boundary.current.epoch === epoch)
        setStatus("saved");
    } catch {
      if (boundary.current.mounted && boundary.current.epoch === epoch)
        setStatus("error");
    }
  }
  return (
    <section className="rounded-2xl border border-good/40 bg-surface p-5 space-y-4">
      <h2 className="text-lg font-semibold">{m.asset}</h2>
      <p className="subtext">{m.assetReview}</p>
      <p className="text-xs text-secondary">{m.verified}</p>
      <label className="block">
        <span className="field-label">{m.assetName}</span>
        <input
          className="field"
          value={name}
          maxLength={160}
          disabled={status === "saving" || status === "saved"}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label className="block">
        <span className="field-label">{m.assetNotes}</span>
        <textarea
          className="field"
          value={notes}
          maxLength={1900}
          rows={6}
          disabled={status === "saving" || status === "saved"}
          onChange={(event) => setNotes(event.target.value)}
        />
      </label>
      <label className="flex items-start gap-3 text-xs leading-6">
        <input
          type="checkbox"
          checked={confirmed}
          disabled={status === "saving" || status === "saved"}
          onChange={(event) => setConfirmed(event.target.checked)}
        />
        {m.assetConfirm}
      </label>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          disabled={
            !confirmed ||
            !name.trim() ||
            status === "saving" ||
            status === "saved"
          }
          onClick={save}
        >
          {status === "saving"
            ? m.saving
            : status === "saved"
              ? m.assetSaved
              : m.asset}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={status === "saving"}
          onClick={onDone}
        >
          {m.openSession}
        </Button>
      </div>
      {status === "saved" && (
        <output className="text-xs text-good">{m.assetSaved}</output>
      )}
      {status === "error" && (
        <p role="alert" className="text-xs text-danger">
          {m.assetFailed}
        </p>
      )}
    </section>
  );
}
