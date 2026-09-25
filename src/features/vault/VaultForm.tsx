import { ShieldCheck } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { Dialog } from "@/components/ui/overlays/Dialog/Dialog";
import { usePreferences } from "@/features/preferences/Preferences";
import { type Envelope, encryptSecret } from "@/lib/vault";
import { vaultMessages } from "./messages";
export function VaultForm({
  open,
  onClose,
  vaultKey,
  save,
}: {
  open: boolean;
  onClose: () => void;
  vaultKey: CryptoKey;
  save: (envelope: Envelope) => Promise<void>;
}) {
  const { locale } = usePreferences();
  const text = vaultMessages[locale];
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(false);
    const form = event.currentTarget;
    const values = new FormData(form);
    try {
      const envelope = await encryptSecret(vaultKey, {
        name: String(values.get("name") || ""),
        secret: String(values.get("secret") || ""),
        notes: String(values.get("notes") || ""),
      });
      await save(envelope);
      form.reset();
      onClose();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={text.add}
      closeLabel={text.close}
    >
      <form key={String(open)} onSubmit={submit} className="space-y-4">
        <p className="flex items-center gap-2 rounded-xl bg-accent/15 p-3 text-xs text-good">
          <ShieldCheck size={16} />
          {text.plaintext}
        </p>
        <label className="block">
          <span className="field-label">{text.label}</span>
          <input
            name="name"
            className="field"
            required
            maxLength={200}
            autoComplete="off"
          />
        </label>
        <label className="block">
          <span className="field-label">{text.secret}</span>
          <textarea
            name="secret"
            className="field font-mono text-xs"
            required
            maxLength={12000}
            rows={4}
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <label className="block">
          <span className="field-label">{text.notes}</span>
          <textarea
            name="notes"
            className="field"
            maxLength={2000}
            rows={2}
            autoComplete="off"
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {text.error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            {text.cancel}
          </Button>
          <Button type="submit" disabled={pending}>
            {text.save}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
