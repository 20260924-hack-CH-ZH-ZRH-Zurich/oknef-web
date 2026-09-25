import { useEffect, useState } from "react";
import { voicePolicySchema } from "@/features/product/contracts";
import { useProductMessages } from "@/features/product/messages";
import { api, mutation } from "@/lib/api";
export function VoicePolicy({
  onBlocked,
  onAllowed,
}: {
  onBlocked?: () => void;
  onAllowed?: (allowed: boolean) => void;
} = {}) {
  const m = useProductMessages();
  const [mode, setMode] = useState("authenticated_session");
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    api("/voice/policy", voicePolicySchema)
      .then((policy) => {
        setMode(policy.mode);
        onAllowed?.(policy.session_allowed);
      })
      .catch(() => setError(true));
  }, [onAllowed]);
  async function change(value: string) {
    setPending(true);
    setError(false);
    try {
      const policy = await api(
        "/voice/policy",
        voicePolicySchema,
        mutation("PUT", { mode: value }),
      );
      setMode(policy.mode);
      onAllowed?.(policy.session_allowed);
      if (!policy.session_allowed) onBlocked?.();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }
  return (
    <details className="mb-3 rounded-xl border border-border p-3 text-xs">
      <summary className="cursor-pointer font-medium">{m.trustMode}</summary>
      <p className="mt-3 leading-6 text-secondary">{m.trustedVoiceHelp}</p>
      <select
        className="field mt-3 text-xs"
        aria-label={m.trustMode}
        value={mode}
        disabled={pending}
        onChange={(event) => change(event.target.value)}
      >
        <option value="authenticated_session">{m.allowVoice}</option>
        <option value="trusted_only">{m.trustedVoice}</option>
      </select>
      {error && (
        <p role="alert" className="mt-2 text-danger">
          {m.error}
        </p>
      )}
    </details>
  );
}
