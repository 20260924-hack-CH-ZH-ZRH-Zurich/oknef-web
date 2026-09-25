import { ArrowLeft, Download, ShieldAlert } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { usePreferences } from "@/features/preferences/Preferences";
import { useProductMessages } from "@/features/product/messages";
import { api, mutation } from "@/lib/api";
import { type SecuritySession, sessionSchema } from "./contracts";
import { useSecurityMessages } from "./messages";
export function SessionDetail({
  session,
  onBack,
  onUpdated,
}: {
  session: SecuritySession;
  onBack: () => void;
  onUpdated: (session: SecuritySession) => void;
}) {
  const m = useSecurityMessages();
  const product = useProductMessages();
  const { locale } = usePreferences();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const question = String(fields.get("question") || "").trim();
    if (!question) return;
    setPending(true);
    setError(false);
    try {
      onUpdated(
        await api(
          `/security/sessions/${encodeURIComponent(session.id)}/questions`,
          sessionSchema,
          mutation("POST", {
            question,
            locale,
            mode: fields.get("mode") || "rules",
          }),
        ),
      );
      form.reset();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }
  function download() {
    const href = URL.createObjectURL(
      new Blob([JSON.stringify(session, null, 2)], {
        type: "application/json",
      }),
    );
    const link = document.createElement("a");
    link.href = href;
    link.download = "oknef-evidence.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  }
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-5 flex items-center gap-2 text-xs text-secondary"
      >
        <ArrowLeft size={16} />
        {m.back}
      </button>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-3 flex gap-2">
            <span className="tag">{m[session.kind]}</span>
            <span className="tag">
              {session.synthetic ? m.learningBadge : m.live}
            </span>
          </div>
          <h2 className="text-2xl font-semibold">{session.title}</h2>
          <p className="mt-2 text-xs text-secondary">
            {new Date(session.created_at).toLocaleString(locale)}
          </p>
        </div>
        <Button variant="secondary" onClick={download}>
          <Download size={15} />
          {m.exportEvidence}
        </Button>
      </div>
      <div className="mt-6 grid items-start gap-6 xl:grid-cols-2">
        <section className="panel">
          <div className="flex items-center gap-3">
            <ShieldAlert size={22} className="text-good" />
            <h3 className="font-semibold">{m[session.assessment.status]}</h3>
          </div>
          <p className="subtext mt-4">{m.boundaries}</p>
          {session.assessment.independent_verification_required && (
            <p className="mt-4 rounded-xl bg-muted p-3 text-xs leading-6 text-secondary">
              {m.independentReminder}
            </p>
          )}
          <h4 className="mt-6 text-sm font-semibold">{m.signal}</h4>
          {session.assessment.signals.length ? (
            <ul className="mt-4 space-y-3">
              {session.assessment.signals.map((signal) => (
                <li
                  key={signal.id}
                  className="rounded-xl border border-border p-4"
                >
                  <p className="text-sm font-semibold">{signal.label}</p>
                  <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-6 text-secondary">
                    {signal.evidence}
                  </p>
                  <code className="mt-3 block text-xs text-secondary">
                    {signal.id}
                  </code>
                </li>
              ))}
            </ul>
          ) : (
            <p className="subtext mt-3">{m.noSignals}</p>
          )}
          <details className="mt-5 text-xs">
            <summary className="cursor-pointer text-secondary">
              {m.methods}
            </summary>
            <p className="mt-3 leading-6">{session.assessment.summary}</p>
            <ul className="mt-2 list-inside list-disc space-y-2 text-secondary">
              {session.assessment.limitations.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
          </details>
        </section>
        <section className="panel">
          <h3 className="font-semibold">{m.evidence}</h3>
          <p className="mb-4 mt-2 text-xs leading-5 text-secondary">
            {m.sourceLanguage}
          </p>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-muted p-4 font-sans text-xs leading-6">
            {session.content}
          </pre>
          {session.evidence?.map((item) => (
            <div
              key={item.id}
              className="mt-4 rounded-xl border border-border p-3 text-xs leading-6"
            >
              <p>
                {item.name} · {item.mime_type}
              </p>
              <p className="break-all font-mono">SHA-256: {item.sha256}</p>
              <p className="text-secondary">{product.localEvidence}</p>
            </div>
          ))}
          {session.reference_text && (
            <details className="mt-4 text-xs">
              <summary className="cursor-pointer">{m.reference}</summary>
              <pre className="mt-3 whitespace-pre-wrap break-words font-sans leading-6">
                {session.reference_text}
              </pre>
            </details>
          )}
        </section>
      </div>
      <section className="panel mt-6">
        <h3 className="font-semibold">{m.questions}</h3>
        <p className="subtext mt-2">{m.noQuestions}</p>
        <div className="my-5 space-y-4">
          {session.questions.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-border p-4"
            >
              <p className="text-sm font-medium">{item.question}</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-secondary">
                {item.answer}
              </p>
              <p className="mt-3 text-xs text-secondary">
                {item.provenance === "stored_evidence_rules"
                  ? m.storedAnswer
                  : `${product.providerConsent} · ${item.model}`}
              </p>
            </article>
          ))}
        </div>
        <form onSubmit={ask} className="flex flex-wrap gap-3">
          <select name="mode" aria-label={product.provider} className="field">
            <option value="rules">{m.storedAnswer}</option>
            <option value="ai">{product.providerConsent}</option>
          </select>
          <input
            name="question"
            aria-label={m.question}
            placeholder={m.question}
            maxLength={2000}
            required
            className="field"
          />
          <Button type="submit" disabled={pending}>
            {m.ask}
          </Button>
        </form>
        {error && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {m.error}
          </p>
        )}
      </section>
    </div>
  );
}
