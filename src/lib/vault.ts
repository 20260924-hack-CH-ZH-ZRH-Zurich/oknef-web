import { z } from "zod";

const encoder = new TextEncoder();
const aad = encoder.encode("oknef:v1:AES-256-GCM");
export const envelopeSchema = z
  .object({
    version: z.literal(1),
    algorithm: z.literal("AES-256-GCM"),
    iv: z.string().regex(/^[A-Za-z0-9+/]{16}$/),
    ciphertext: z
      .string()
      .regex(/^[A-Za-z0-9+/]+={0,2}$/)
      .min(24)
      .max(100000),
  })
  .strict();
export type Envelope = z.infer<typeof envelopeSchema>;
export const secretSchema = z
  .object({
    name: z.string().min(1).max(200),
    secret: z.string().min(1).max(12000),
    notes: z.string().max(2000),
  })
  .strict();
export type VaultSecret = z.infer<typeof secretSchema>;
export function base64(bytes: Uint8Array) {
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""));
}
export function bytes(value: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}
export async function createVaultKey() {
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
  const exported = new Uint8Array(await crypto.subtle.exportKey("raw", key));
  return { key, recovery: `oknef-key-v1.${base64(exported)}` };
}
export async function importVaultKey(recovery: string) {
  if (!/^oknef-key-v1\.[A-Za-z0-9+/]{43}=$/.test(recovery.trim()))
    throw new Error("Invalid recovery key");
  const raw = bytes(recovery.trim().slice("oknef-key-v1.".length));
  if (raw.byteLength !== 32) throw new Error("Invalid recovery key");
  try {
    return await crypto.subtle.importKey("raw", raw, "AES-GCM", false, [
      "encrypt",
      "decrypt",
    ]);
  } finally {
    raw.fill(0);
  }
}
export async function encryptSecret(
  key: CryptoKey,
  secret: VaultSecret,
): Promise<Envelope> {
  const validated = secretSchema.parse(secret);
  const plaintext = encoder.encode(JSON.stringify(validated));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  try {
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: aad, tagLength: 128 },
      key,
      plaintext,
    );
    return {
      version: 1,
      algorithm: "AES-256-GCM",
      iv: base64(iv),
      ciphertext: base64(new Uint8Array(ciphertext)),
    };
  } finally {
    plaintext.fill(0);
  }
}
export async function decryptSecret(
  key: CryptoKey,
  input: unknown,
): Promise<VaultSecret> {
  const envelope = envelopeSchema.parse(input);
  const plaintext = new Uint8Array(
    await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: bytes(envelope.iv),
        additionalData: aad,
        tagLength: 128,
      },
      key,
      bytes(envelope.ciphertext),
    ),
  );
  try {
    return secretSchema.parse(JSON.parse(new TextDecoder().decode(plaintext)));
  } finally {
    plaintext.fill(0);
  }
}
