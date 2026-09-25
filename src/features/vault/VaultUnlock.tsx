import { Download, Eye, EyeOff, KeyRound, LockKeyhole } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { usePreferences } from "@/features/preferences/Preferences";
import {
  enrollDeviceVault,
  forgetDeviceVault,
  readDeviceVault,
  unlockDeviceVault,
} from "@/lib/deviceVault";
import {
  createVaultKey,
  decryptSecret,
  type Envelope,
  importVaultKey,
} from "@/lib/vault";
import { deviceMessages } from "./deviceMessages";
import { vaultMessages } from "./messages";
export function VaultUnlock({
  onUnlock,
  owner,
  verificationEnvelope,
}: {
  onUnlock: (key: CryptoKey) => void;
  owner: string;
  verificationEnvelope?: Envelope;
}) {
  const { locale } = usePreferences();
  const text = vaultMessages[locale];
  const device = deviceMessages[locale];
  const [deviceAvailable, setDeviceAvailable] = useState(false);
  const [enableDevice, setEnableDevice] = useState(false);
  const [deviceError, setDeviceError] = useState(false);
  const lifetime = useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    lifetime.current = controller;
    setDeviceAvailable(!!readDeviceVault(owner));
    return () => controller.abort();
  }, [owner]);
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
    if (pending) return;
    setPending(true);
    setError(false);
    setDeviceError(false);
    try {
      const key = await importVaultKey(recovery);
      if (verificationEnvelope) await decryptSecret(key, verificationEnvelope);
      if (enableDevice)
        await enrollDeviceVault(owner, recovery, lifetime.current?.signal);
      lifetime.current?.signal.throwIfAborted();
      setRecovery("");
      onUnlock(key);
    } catch {
      if (enableDevice) setDeviceError(true);
      else setError(true);
    } finally {
      setPending(false);
    }
  }
  async function confirm() {
    if (!generated || !acknowledged || pending) return;
    setPending(true);
    setDeviceError(false);
    try {
      if (enableDevice)
        await enrollDeviceVault(owner, recovery, lifetime.current?.signal);
      lifetime.current?.signal.throwIfAborted();
      onUnlock(generated);
      setRecovery("");
      setGenerated(null);
    } catch {
      setDeviceError(true);
    } finally {
      setPending(false);
    }
  }
  async function deviceUnlock() {
    if (pending) return;
    setPending(true);
    setDeviceError(false);
    try {
      const key = await unlockDeviceVault(owner, lifetime.current?.signal);
      if (verificationEnvelope) await decryptSecret(key, verificationEnvelope);
      lifetime.current?.signal.throwIfAborted();
      onUnlock(key);
    } catch {
      setDeviceError(true);
    } finally {
      setPending(false);
    }
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
      <p className="mt-4 text-xs leading-6 text-secondary">{device.help}</p>
      {deviceAvailable && !generated && (
        <div className="mt-5 space-y-3">
          <Button className="w-full" disabled={pending} onClick={deviceUnlock}>
            <KeyRound size={16} />
            {device.unlock}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            disabled={pending}
            onClick={() => {
              forgetDeviceVault(owner);
              setDeviceAvailable(false);
            }}
          >
            {device.forget}
          </Button>
        </div>
      )}
      {deviceError && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {device.failed}
        </p>
      )}
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
        {!deviceAvailable && (
          <label className="flex items-start gap-3 text-xs leading-6">
            <input
              type="checkbox"
              className="mt-1.5"
              checked={enableDevice}
              disabled={pending}
              onChange={(event) => setEnableDevice(event.target.checked)}
            />
            {device.enable}
          </label>
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
              disabled={!acknowledged || pending}
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
              disabled={!recovery.trim() || pending}
            >
              <KeyRound size={16} />
              {text.unlock}
            </Button>
            {!verificationEnvelope && (
              <Button
                variant="secondary"
                className="w-full"
                disabled={pending}
                onClick={create}
              >
                {text.create}
              </Button>
            )}
          </>
        )}
      </form>
    </section>
  );
}
