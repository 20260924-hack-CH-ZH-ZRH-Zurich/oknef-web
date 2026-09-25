import { type FormEvent, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/buttons/Button/Button";
import { Dialog } from "@/components/ui/overlays/Dialog/Dialog";
import {
  type Evidence,
  fingerprint,
  retainEvidence,
} from "@/features/evidence/localStore";
import { MediaEvidence } from "@/features/evidence/MediaEvidence";
import { useProductMessages } from "@/features/product/messages";
import { QrCapture } from "@/features/qr/QrCapture";
import { api, mutation, userSchema } from "@/lib/api";
import {
  type SecuritySession,
  type SessionKind,
  sessionInputSchema,
  sessionSchema,
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
  const product = useProductMessages();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [savedWithoutOriginal, setSavedWithoutOriginal] =
    useState<SecuritySession | null>(null);
  const [content, setContent] = useState("");
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
  }, [kind]);
  async function evidence(file: File, source: Evidence["source"]) {
    setOriginal({ file, metadata: await fingerprint(file, source) });
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    try {
      const session = await api(
        "/security/sessions",
        sessionSchema,
        mutation("POST", result.data),
      );
      if (original) {
        try {
          const response = await api(
            "/auth/me",
            z.union([userSchema, z.object({ user: userSchema }).strict()]),
          );
          const user = "user" in response ? response.user : response;
          await retainEvidence(
            `${user.tenant_id}:${user.id}`,
            session.id,
            original.file,
            original.metadata,
          );
        } catch {
          setError(`${product.evidenceSaved}. ${product.noOriginal}`);
          setSavedWithoutOriginal(session);
          return;
        }
      }
      onSaved(session);
      onClose();
    } catch {
      setError(m.error);
    } finally {
      setPending(false);
    }
  }
  const form = kind && (
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
          placeholder={m.sampleTitle}
        />
      </label>
      {kind === "qr" && (
        <QrCapture onDecoded={setContent} onEvidence={evidence} />
      )}
      {["call", "video", "document", "identity"].includes(kind) && (
        <MediaEvidence kind={kind} onText={setContent} onEvidence={evidence} />
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
        {m.evidenceConsent}
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
              onSaved(savedWithoutOriginal);
              onClose();
            }}
          >
            {product.openSession}
          </Button>
        )}
        <Button type="submit" disabled={pending || !!savedWithoutOriginal}>
          {pending ? m.checking : m.check}
        </Button>
        {inline && (
          <Button type="button" variant="ghost" onClick={onClose}>
            {m.close}
          </Button>
        )}
      </div>
    </form>
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
