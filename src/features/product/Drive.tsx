import { Download, FileLock2, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/buttons/Button/Button";
import {
  downloadBlob,
  type LocalEvidence,
  listEvidence,
  originalEvidence,
  removeEvidence,
} from "@/features/evidence/localStore";
import { usePreferences } from "@/features/preferences/Preferences";
import { VaultUnlock } from "@/features/vault/VaultUnlock";
import { api, mutation, timestampSchema, type User } from "@/lib/api";
import { base64, bytes, envelopeSchema } from "@/lib/vault";
import { useProductMessages } from "./messages";

const itemSchema = z
  .object({
    id: z.string(),
    envelope: envelopeSchema.extend({
      ciphertext: z
        .string()
        .regex(/^[A-Za-z0-9+/]+={0,2}$/)
        .max(12_000_000),
    }),
    created_at: timestampSchema,
    created_by: z.string(),
    synthetic: z.boolean(),
  })
  .strict();
const fileSchema = z
  .object({
    name: z.string().max(200),
    mime: z.string().max(100),
    data: z.string().max(8_000_000),
  })
  .strict();
const aad = new TextEncoder().encode("oknef:drive:v1");
export function Drive({ user }: { user: User }) {
  const m = useProductMessages();
  const { locale } = usePreferences();
  const scope = `${user.tenant_id}:${user.id}`;
  const [files, setFiles] = useState<LocalEvidence[]>([]);
  const [items, setItems] = useState<z.infer<typeof itemSchema>[]>([]);
  const [error, setError] = useState("");
  const [key, setKey] = useState<CryptoKey | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const [local, cloud] = await Promise.all([
        listEvidence(scope),
        api("/drive", z.object({ items: z.array(itemSchema) }).strict()),
      ]);
      setFiles(local);
      setItems(cloud.items);
      setError("");
    } catch {
      setError(m.error);
    }
  }, [scope, m.error]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (!key) return;
    const timer = setTimeout(() => setKey(null), 300000);
    return () => clearTimeout(timer);
  }, [key]);
  async function upload() {
    if (!key || !file) return;
    setPending(true);
    setError("");
    try {
      if (file.size > 5_000_000) throw new Error("size");
      const payload = new TextEncoder().encode(
        JSON.stringify({
          name: file.name.slice(0, 200),
          mime: file.type || "application/octet-stream",
          data: base64(new Uint8Array(await file.arrayBuffer())),
        }),
      );
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv, additionalData: aad },
        key,
        payload,
      );
      payload.fill(0);
      await api(
        "/drive",
        itemSchema,
        mutation("POST", {
          envelope: {
            version: 1,
            algorithm: "AES-256-GCM",
            iv: base64(iv),
            ciphertext: base64(new Uint8Array(ciphertext)),
          },
        }),
      );
      setFile(null);
      await refresh();
    } catch {
      setError(
        file.size > 5_000_000
          ? `${m.fileTooLarge} 5 MB. ${m.localFiles}`
          : m.error,
      );
    } finally {
      setPending(false);
    }
  }
  async function download(item: z.infer<typeof itemSchema>) {
    if (!key) return;
    try {
      const plaintext = new Uint8Array(
        await crypto.subtle.decrypt(
          { name: "AES-GCM", iv: bytes(item.envelope.iv), additionalData: aad },
          key,
          bytes(item.envelope.ciphertext),
        ),
      );
      const payload = fileSchema.parse(
        JSON.parse(new TextDecoder().decode(plaintext)),
      );
      plaintext.fill(0);
      downloadBlob(
        new Blob([bytes(payload.data)], { type: payload.mime }),
        payload.name,
      );
    } catch {
      setError(m.error);
    }
  }
  return (
    <section className="space-y-6">
      <header>
        <h1 className="page-title">{m.drive}</h1>
        <p className="subtext mt-3">{m.driveIntro}</p>
      </header>
      <p className="panel text-xs leading-6 text-secondary">
        {m.driveBoundary}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          className="panel flex items-center gap-3 font-semibold"
          href={`/${locale}/workspace?view=secrets`}
        >
          <LockKeyhole size={22} className="text-good" />
          {m.secureVault}
        </Link>
        <Link
          className="panel flex items-center gap-3 font-semibold"
          href={`/${locale}/workspace?view=files`}
        >
          <FileLock2 size={22} className="text-good" />
          {m.localFiles} · .oknefq
        </Link>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <section className="panel">
        <h2 className="font-semibold">
          {m.encryptedRecords} · {items.length}
        </h2>
        {!key ? (
          <VaultUnlock onUnlock={setKey} />
        ) : (
          <div className="mt-5 space-y-4">
            <p className="text-xs text-secondary">
              AES-256-GCM · 5 MB / file · {m.localFiles}: .oknefq
            </p>
            <label className="block">
              <span className="field-label">{m.upload}</span>
              <input
                type="file"
                className="field"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <div className="flex gap-3">
              <Button disabled={!file || pending} onClick={upload}>
                {m.save}
              </Button>
              <Button variant="secondary" onClick={() => setKey(null)}>
                <LockKeyhole size={15} />
                {m.close}
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-border p-4"
                >
                  <p className="text-xs font-mono">{item.id.slice(0, 8)}</p>
                  <p className="mt-2 text-xs text-secondary">
                    {new Date(item.created_at).toLocaleDateString(locale)}
                  </p>
                  <Button
                    variant="secondary"
                    className="mt-3"
                    onClick={() => download(item)}
                  >
                    <Download size={15} />
                    {m.download}
                  </Button>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
      <section>
        <h2 className="mb-4 font-semibold">{m.evidenceRecords}</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {files.map((item) => (
            <article className="panel" key={item.id}>
              <h3 className="break-words font-semibold">{item.name}</h3>
              <p className="subtext mt-2">
                {item.mime_type} · {item.size_bytes} {m.bytes}
              </p>
              <p className="mt-3 break-all font-mono text-[.6rem] text-secondary">
                SHA-256 {item.sha256}
              </p>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() =>
                    originalEvidence(scope, item)
                      .then((blob) => downloadBlob(blob, item.name))
                      .catch(() => setError(m.error))
                  }
                >
                  {m.download}
                </Button>
                <Button
                  variant="ghost"
                  className="mt-3"
                  onClick={async () => {
                    try {
                      await api(
                        `/drive/${encodeURIComponent(item.id)}`,
                        z.object({ deleted: z.boolean() }).strict(),
                        mutation("DELETE"),
                      );
                      await refresh();
                    } catch {
                      setError(m.error);
                    }
                  }}
                >
                  {m.remove}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() =>
                    removeEvidence(scope, item)
                      .then(refresh)
                      .catch(() => setError(m.error))
                  }
                >
                  {m.remove}
                </Button>
              </div>
            </article>
          ))}
        </div>
        {!files.length && <p className="panel subtext">{m.empty}</p>}
      </section>
    </section>
  );
}
