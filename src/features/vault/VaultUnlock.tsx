import { Download, Eye, EyeOff, KeyRound, LockKeyhole } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { usePreferences } from "@/features/preferences/Preferences";
import { createVaultKey, importVaultKey } from "@/lib/vault";
import { vaultMessages } from "./messages";
export function VaultUnlock({
  onUnlock,
}: {
  onUnlock: (key: CryptoKey) => void;
}) {
  const { locale } = usePreferences();
  const text = vaultMessages[locale];
  const [recovery, setRecovery] = useState("");
  const [generated, setGenerated] = useState<CryptoKey | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);
  async function create() {
    setPending(true);
    setError(false);
    try {
      const result = await createVaultKey();
      setRecovery(result.recovery);
      setGenerated(result.key);
      setAcknowledged(false);
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }
  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(false);
    try {
      const key = await importVaultKey(recovery);
      setRecovery("");
      onUnlock(key);
    } catch {
      setError(true);
    }
  }
  function confirm() {
    if (!generated || !acknowledged) return;
    onUnlock(generated);
    setRecovery("");
    setGenerated(null);
  }
  function exportKey() {
    const url = URL.createObjectURL(
      new Blob([recovery], { type: "text/plain" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "oknef-recovery-key.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return (
    <section className="panel mx-auto mt-8 max-w-xl">
      <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-accent/20 text-good">
        <LockKeyhole size={25} />
      </div>
      <h2 className="text-xl font-semibold">
        {generated ? text.newKey : text.locked}
      </h2>
      <p className="subtext mt-4">
        {generated ? text.keyWarning : text.keyExists}
      </p>
      <form onSubmit={unlock} className="mt-6 space-y-4">
        <label className="block">
          <span className="field-label">{text.recovery}</span>
          <div className="relative">
            <input
              aria-label={text.recovery}
              autoComplete="off"
              spellCheck={false}
              type={visible ? "text" : "password"}
              readOnly={!!generated}
              required
              value={recovery}
              onChange={(event) => setRecovery(event.target.value)}
              placeholder={text.keyPlaceholder}
              className="field pr-12 font-mono text-xs"
            />
            <button
              type="button"
              className="absolute right-3 top-3 text-secondary"
              aria-label={visible ? text.hideKey : text.showKey}
              title={visible ? text.hideKey : text.showKey}
              onClick={() => setVisible(!visible)}
            >
              {visible ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </label>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {text.wrongKey}
          </p>
        )}
        {generated ? (
          <>
            <Button variant="secondary" className="w-full" onClick={exportKey}>
              <Download size={16} />
              {text.downloadKey}
            </Button>
            <p className="text-xs leading-6 text-secondary">
              {text.exportWarning}
            </p>
            <label className="flex items-start gap-3 rounded-xl bg-muted p-4 text-xs leading-6">
              <input
                className="mt-1.5"
                type="checkbox"
                checked={acknowledged}
                onChange={(event) => setAcknowledged(event.target.checked)}
              />
              {text.acknowledge}
            </label>
            <Button
              className="w-full"
              disabled={!acknowledged}
              onClick={confirm}
            >
              {text.open}
            </Button>
          </>
        ) : (
          <>
            <Button
              type="submit"
              className="w-full"
              disabled={!recovery.trim()}
            >
              <KeyRound size={16} />
              {text.unlock}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              disabled={pending}
              onClick={create}
            >
              {text.create}
            </Button>
          </>
        )}
      </form>
    </section>
  );
}
