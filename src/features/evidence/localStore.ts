import { z } from "zod";
export const evidenceSchema = z
  .object({
    name: z.string().max(200),
    mime_type: z.string().max(120),
    size_bytes: z.number().int().min(0).max(25_000_000),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    source: z.enum(["camera", "upload", "microphone", "text"]),
    captured_at: z.number().int().nonnegative().optional(),
  })
  .strict();
export type Evidence = z.infer<typeof evidenceSchema>;
export type LocalEvidence = Evidence & {
  id: string;
  session_id: string;
  scope: string;
  iv: Uint8Array;
  ciphertext: ArrayBuffer;
};
const database = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("oknef-evidence-v1", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("files", { keyPath: "id" });
      request.result.createObjectStore("keys");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
async function transaction<T>(
  store: "files" | "keys",
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await database();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(store, mode);
      const request = action(tx.objectStore(store));
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
async function keyFor(scope: string): Promise<CryptoKey> {
  const candidate = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  const db = await database();
  try {
    return await new Promise<CryptoKey>((resolve, reject) => {
      const tx = db.transaction("keys", "readwrite");
      const store = tx.objectStore("keys");
      const read = store.get(scope);
      let selected: CryptoKey;
      read.onsuccess = () => {
        selected = read.result ?? candidate;
        if (!read.result) store.put(candidate, scope);
      };
      tx.oncomplete = () => resolve(selected);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function fingerprint(
  file: Blob & { name?: string },
  source: Evidence["source"],
): Promise<Evidence> {
  if (file.size > 25_000_000) throw new Error("evidence too large");
  const digest = await crypto.subtle.digest(
    "SHA-256",
    await file.arrayBuffer(),
  );
  return evidenceSchema.parse({
    name: (file.name || "capture").slice(0, 160),
    mime_type: file.type.split(";")[0] || "application/octet-stream",
    size_bytes: file.size,
    sha256: Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join(""),
    source,
    captured_at: Math.floor(Date.now() / 1000),
  });
}
export async function retainEvidence(
  scope: string,
  sessionId: string,
  file: File,
  evidence: Evidence,
) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await keyFor(scope);
  const id = `${scope}:${sessionId}:${evidence.sha256}`;
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: new TextEncoder().encode(id) },
    key,
    await file.arrayBuffer(),
  );
  await transaction("files", "readwrite", (store) =>
    store.put({
      ...evidence,
      id,
      session_id: sessionId,
      scope,
      iv,
      ciphertext,
    }),
  );
}
export async function listEvidence(scope: string): Promise<LocalEvidence[]> {
  const all = await transaction<LocalEvidence[]>("files", "readonly", (store) =>
    store.getAll(),
  );
  return all.filter((file) => file.scope === scope);
}
export async function originalEvidence(scope: string, item: LocalEvidence) {
  if (item.scope !== scope) throw new Error("scope mismatch");
  const key = await keyFor(scope);
  const plaintext = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(item.iv),
      additionalData: new TextEncoder().encode(item.id),
    },
    key,
    item.ciphertext,
  );
  return new Blob([plaintext], { type: item.mime_type });
}
export async function removeEvidence(scope: string, item: LocalEvidence) {
  if (item.scope !== scope) throw new Error("scope mismatch");
  await transaction("files", "readwrite", (store) => store.delete(item.id));
}
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name.replace(/[^\p{L}\p{N} ._()-]/gu, "_");
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
