import { type FormEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { Dialog } from "@/components/ui/overlays/Dialog/Dialog";
import { DocumentAsset } from "@/features/capture/DocumentAsset";
import { useCaptureMessages } from "@/features/capture/messages";
import { saveEvidenceSession } from "@/features/capture/saveSession";
import { suggestedName } from "@/features/capture/sessionCapture";
import { useCaptureBoundary } from "@/features/capture/useCaptureBoundary";
import type { DocumentReply } from "@/features/chat/documents";
import { type Evidence, fingerprint } from "@/features/evidence/localStore";
import { MediaEvidence } from "@/features/evidence/MediaEvidence";
import { usePreferences } from "@/features/preferences/Preferences";
import { useProductMessages } from "@/features/product/messages";
import { QrCapture } from "@/features/qr/QrCapture";
import {
  type SecuritySession,
  type SessionKind,
  sessionInputSchema,
} from "./contracts";
import { useSecurityMessages } from "./messages";
export function SessionForm({
  kind,
  onClose,
  onSaved,
  inline = false,
  parentSessionId,
}: {
  kind: SessionKind | null;
  onClose: () => void;
  onSaved: (session: SecuritySession) => void;
  inline?: boolean;
  parentSessionId?: string;
}) {
  const m = useSecurityMessages();
  const boundary = useCaptureBoundary();
  const product = useProductMessages();
  const capture = useCaptureMessages();
  const { locale } = usePreferences();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [savedWithoutOriginal, setSavedWithoutOriginal] =
    useState<SecuritySession | null>(null);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState(() =>
    kind ? suggestedName(m[kind]) : "",
  );
  const titleEdited = useRef(false);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [documentResult, setDocumentResult] = useState<DocumentReply>();
  const [assetSession, setAssetSession] = useState<SecuritySession | null>(
    null,
  );
  const [original, setOriginal] = useState<{
    file: File;
    metadata: Evidence;
  } | null>(null);
  const previousKind = useRef(kind);
  useEffect(() => {
    if (previousKind.current === kind) return;
    previousKind.current = kind;
    setContent("");
    setOriginal(null);
    setError("");
    setSavedWithoutOriginal(null);
    setAssetSession(null);
    setDocumentResult(undefined);
    setMediaBusy(false);
    titleEdited.current = false;
    setTitle(kind ? suggestedName(m[kind]) : "");
  }, [kind, m]);
  async function evidence(file: File, source: Evidence["source"]) {
    const epoch = boundary.current.epoch;
    const metadata = await fingerprint(file, source);
    if (!boundary.current.mounted || epoch !== boundary.current.epoch) return;
    setOriginal({ file, metadata });
    if (kind && !titleEdited.current)
      setTitle(suggestedName(m[kind], file.name));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || mediaBusy || assetSession || savedWithoutOriginal) return;
    const fields = new FormData(event.currentTarget);
    const reference = String(fields.get("reference") || "").trim();
    const result = sessionInputSchema.safeParse({
      kind,
      title: String(fields.get("title") || "").trim(),
      content: content.trim(),
      ...(reference ? { reference_text: reference } : {}),
      ...(original ? { evidence: [original.metadata] } : {}),
      ...(parentSessionId ? { parent_session_id: parentSessionId } : {}),
    });
    if (!result.success || fields.get("consent") !== "on") {
      setError(m.confirmRequired);
      return;
    }
    setPending(true);
    setError("");
    const { epoch, controller } = boundary.current;
    try {
      const { session, originalRetained } = await saveEvidenceSession(
        result.data,
        original,
        locale,
        controller.signal,
      );
      if (!boundary.current.mounted || epoch !== boundary.current.epoch) return;
      if (!originalRetained) {
        setError(`${product.evidenceSaved}. ${product.noOriginal}`);
        setSavedWithoutOriginal(session);
        return;
      }
      if (documentResult) {
        setAssetSession(session);
        return;
      }
      onSaved(session);
      onClose();
    } catch {
      if (boundary.current.mounted && epoch === boundary.current.epoch)
        setError(m.error);
    } finally {
      if (boundary.current.mounted && epoch === boundary.current.epoch)
        setPending(false);
    }
  }
  const form =
    assetSession && documentResult ? (
      <DocumentAsset
        sessionId={assetSession.id}
        document={documentResult}
        defaultName={title || capture.documentDefault}
        onDone={() => {
          onSaved(assetSession);
          onClose();
        }}
      />
    ) : (
      kind && (
        <form key={kind} onSubmit={submit} className="space-y-5">
          <p className="rounded-xl bg-muted p-4 text-xs leading-6 text-secondary">
            {m[`${kind}Help`]}
          </p>
          <label className="block">
            <span className="field-label">{m.sessionName}</span>
            <input
              name="title"
              className="field"
              maxLength={160}
              required
              value={title}
              onChange={(event) => {
                titleEdited.current = true;
                setTitle(event.target.value);
              }}
              placeholder={m.sampleTitle}
            />
          </label>
          {kind === "qr" && (
            <QrCapture
              onDecoded={setContent}
              onEvidence={evidence}
              onBusyChange={setMediaBusy}
            />
          )}
          {["call", "video", "document", "identity"].includes(kind) && (
            <MediaEvidence
              kind={kind}
              onText={setContent}
              onEvidence={evidence}
              onDocument={setDocumentResult}
              onBusyChange={setMediaBusy}
            />
          )}
          {original && (
            <div className="rounded-xl bg-muted p-3 text-xs leading-6">
              <p>
                {original.metadata.name} · {original.metadata.size_bytes}{" "}
                {product.bytes}
              </p>
              <p className="break-all font-mono">
                SHA-256: {original.metadata.sha256}
              </p>
              <p className="text-secondary">{product.localEvidence}</p>
            </div>
          )}
          <label className="block">
            <span className="field-label">{m.content}</span>
            <textarea
              name="content"
              className="field"
              rows={5}
              maxLength={20000}
              required
              placeholder={m.pastedEvidence}
              autoCapitalize="off"
              autoComplete="off"
              spellCheck={false}
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
          </label>
          {["document", "identity"].includes(kind) && (
            <label className="block">
              <span className="field-label">{m.reference}</span>
              <textarea
                name="reference"
                className="field"
                rows={3}
                maxLength={10000}
              />
              <span className="mt-2 block text-xs leading-5 text-secondary">
                {m.referenceHelp}
              </span>
            </label>
          )}
          <label className="flex items-start gap-3 text-xs leading-6 text-secondary">
            <input type="checkbox" name="consent" required className="mt-1.5" />
            {original ? capture.receiptConsent : m.evidenceConsent}
          </label>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            {savedWithoutOriginal && (
              <Button
                type="button"
                onClick={() => {
                  if (documentResult) {
                    setAssetSession(savedWithoutOriginal);
                    return;
                  }
                  onSaved(savedWithoutOriginal);
                  onClose();
                }}
              >
                {product.openSession}
              </Button>
            )}
            <Button
              type="submit"
              disabled={pending || mediaBusy || !!savedWithoutOriginal}
            >
              {pending ? m.checking : m.check}
            </Button>
            {inline && (
              <Button type="button" variant="ghost" onClick={onClose}>
                {m.close}
              </Button>
            )}
          </div>
        </form>
      )
    );
  if (inline)
    return (
      <section className="rounded-2xl border border-good/40 bg-surface p-5">
        <h2 className="mb-5 text-lg font-semibold">
          {kind ? m[kind] : m.newSession}
        </h2>
        {form}
      </section>
    );
  return (
    <Dialog
      open={kind !== null}
      title={kind ? m[kind] : m.newSession}
      onClose={onClose}
      closeLabel={m.close}
    >
      {form}
    </Dialog>
  );
}
