import {
  Download,
  Eye,
  EyeOff,
  LockKeyhole,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/buttons/Button/Button";
import { Dialog } from "@/components/ui/overlays/Dialog/Dialog";
import { usePreferences } from "@/features/preferences/Preferences";
import { api, mutation, timestampSchema } from "@/lib/api";
import {
  decryptSecret,
  type Envelope,
  envelopeSchema,
  type VaultSecret,
} from "@/lib/vault";
import { vaultMessages } from "./messages";
import { VaultForm } from "./VaultForm";
import { VaultUnlock } from "./VaultUnlock";

const itemSchema = z
  .object({
    id: z.string(),
    envelope: envelopeSchema,
    created_at: timestampSchema,
    updated_at: timestampSchema,
  })
  .strict();
type VaultItem = z.infer<typeof itemSchema>;
export function Vault({ owner }: { owner: string }) {
  const { locale, t } = usePreferences();
  const text = vaultMessages[locale];
  const [key, setKey] = useState<CryptoKey | null>(null);
  const activeKey = useRef<CryptoKey | null>(null);
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [opened, setOpened] = useState<Record<string, VaultSecret>>({});
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<"error" | "failed" | null>(null);
  const [pending, setPending] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const result = await api(
        "/vault",
        z.object({ items: z.array(itemSchema) }).strict(),
      );
      setItems(result.items);
      setLoaded(true);
    } catch {
      setError("error");
    }
  }, []);
  useEffect(() => {
    refresh();
    return () => {
      activeKey.current = null;
    };
  }, [refresh]);
  const lock = useCallback(() => {
    activeKey.current = null;
    setKey(null);
    setOpened({});
    setAdding(false);
    setError(null);
  }, []);
  useEffect(() => {
    if (!key) return;
    const timer = setTimeout(lock, 5 * 60 * 1000);
    const hide = () => {
      if (document.visibilityState === "hidden") lock();
    };
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("pagehide", lock);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("pagehide", lock);
    };
  }, [key, lock]);
  async function save(envelope: Envelope) {
    await api("/vault", itemSchema, mutation("POST", { envelope }));
    await refresh();
  }
  async function reveal(item: VaultItem) {
    if (!key) return;
    if (opened[item.id]) {
      setOpened((previous) => {
        const next = { ...previous };
        delete next[item.id];
        return next;
      });
      return;
    }
    setError(null);
    try {
      const content = await decryptSecret(key, item.envelope);
      if (activeKey.current === key)
        setOpened((previous) => ({ ...previous, [item.id]: content }));
    } catch {
      setError("failed");
    }
  }
  async function remove() {
    if (!deleting) return;
    setPending(true);
    try {
      await api(
        `/vault/${encodeURIComponent(deleting)}`,
        z.object({ deleted: z.boolean() }).strict(),
        mutation("DELETE"),
      );
      setOpened((previous) => {
        const next = { ...previous };
        delete next[deleting];
        return next;
      });
      setDeleting(null);
      await refresh();
    } catch {
      setError("error");
    } finally {
      setPending(false);
    }
  }
  function download(item: VaultItem) {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(item.envelope, null, 2)], {
        type: "application/json",
      }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${item.id}.oknef`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <header className="mb-7 flex flex-wrap items-start justify-between gap-5">
        <div>
          <h1 className="page-title">{text.title}</h1>
          <p className="subtext mt-3 max-w-2xl">{text.subtitle}</p>
        </div>
        {key && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={lock}>
              <LockKeyhole size={16} />
              {text.lock}
            </Button>
            <Button onClick={() => setAdding(true)}>
              <Plus size={16} />
              {text.add}
            </Button>
          </div>
        )}
      </header>
      <p className="flex gap-3 rounded-2xl border border-border bg-surface p-5 text-xs leading-6 text-secondary">
        <ShieldCheck size={22} className="shrink-0 text-good" />
        {text.notice}
      </p>
      {error && (
        <p
          role="alert"
          className="mt-5 rounded-xl bg-danger-soft p-3 text-sm text-danger"
        >
          {text[error]}
        </p>
      )}
      {!loaded ? (
        <section className="panel mt-8">
          <output>{t(error ? "error" : "loading")}</output>
          {error && <Button onClick={refresh}>{t("retry")}</Button>}
        </section>
      ) : !key ? (
        <VaultUnlock
          owner={owner}
          verificationEnvelope={items[0]?.envelope}
          onUnlock={(value) => {
            activeKey.current = value;
            setKey(value);
          }}
        />
      ) : (
        <>
          <p className="my-5 text-xs leading-6 text-secondary">{text.memory}</p>
          {items.length === 0 ? (
            <div className="panel py-14 text-center">
              <LockKeyhole size={35} className="mx-auto text-good" />
              <p className="mt-5 text-sm text-secondary">{text.empty}</p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {items.map((item) => (
                <article key={item.id} className="panel">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold">
                        {opened[item.id]?.name ||
                          `${text.record} ${item.id.slice(0, 8)}`}
                      </h2>
                      <p className="mt-2 text-xs text-secondary">
                        {text.created}:{" "}
                        {new Date(item.created_at).toLocaleDateString(locale)}
                      </p>
                    </div>
                    <LockKeyhole size={20} className="shrink-0 text-good" />
                  </div>
                  {opened[item.id] && (
                    <div className="mt-5 rounded-xl bg-muted p-4">
                      <p className="mb-3 text-[.65rem] text-good">
                        {text.plaintext}
                      </p>
                      <p className="whitespace-pre-wrap break-all font-mono text-xs leading-6">
                        {opened[item.id].secret}
                      </p>
                      {opened[item.id].notes && (
                        <p className="mt-4 whitespace-pre-wrap text-xs leading-6 text-secondary">
                          {opened[item.id].notes}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="mt-6 flex items-center gap-2">
                    <Button
                      variant="secondary"
                      className="mr-auto"
                      onClick={() => reveal(item)}
                    >
                      {opened[item.id] ? (
                        <EyeOff size={15} />
                      ) : (
                        <Eye size={15} />
                      )}{" "}
                      {opened[item.id] ? text.hide : text.show}
                    </Button>
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => download(item)}
                      aria-label={text.export}
                      title={text.export}
                    >
                      <Download size={16} />
                    </button>
                    <button
                      type="button"
                      className="icon-button text-danger"
                      onClick={() => setDeleting(item.id)}
                      aria-label={text.delete}
                      title={text.delete}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
          <VaultForm
            open={adding}
            onClose={() => setAdding(false)}
            vaultKey={key}
            save={save}
          />
        </>
      )}
      <Dialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={text.delete}
        closeLabel={text.close}
      >
        <p className="subtext">{text.confirmDelete}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleting(null)}>
            {text.cancel}
          </Button>
          <Button variant="danger" disabled={pending} onClick={remove}>
            {text.delete}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
