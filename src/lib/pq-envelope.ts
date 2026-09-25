import { ml_kem768_x25519 as kem } from "@noble/post-quantum/hybrid.js";
import { z } from "zod";

export const MAX_FILE_BYTES = 2 * 1024 * 1024;
export const MAX_ENVELOPE_BYTES = 4 * 1024 * 1024;
const encoder = new TextEncoder();
const suite = "X-Wing/HKDF-SHA-256/AES-256-GCM" as const;
const recoveryPrefix = "oknef-recovery-pq-v1.";
const recipientPrefix = "oknef-recipient-pq-v1.";
const base64Pattern =
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const b64 = (length: number) =>
  z
    .string()
    .length(4 * Math.ceil(length / 3))
    .regex(base64Pattern);
const headerSchema = z
  .object({
    format: z.literal("oknefq"),
    version: z.literal(1),
    suite: z.literal(suite),
    recipient: z.string().regex(/^[a-f0-9]{64}$/),
    capsule: b64(1120),
    salt: b64(32),
    iv: b64(12),
  })
  .strict();
const envelopeSchema = z
  .object({
    header: headerSchema,
    ciphertext: z.string().min(24).max(MAX_ENVELOPE_BYTES).regex(base64Pattern),
  })
  .strict();
const payloadSchema = z
  .object({
    name: z.string().min(1).max(240),
    type: z.string().max(120),
    data: z
      .string()
      .max(4 * Math.ceil(MAX_FILE_BYTES / 3))
      .regex(base64Pattern),
  })
  .strict();
type Header = z.infer<typeof headerSchema>;

function encode(value: Uint8Array) {
  let text = "";
  for (let offset = 0; offset < value.length; offset += 8192)
    text += String.fromCharCode(...value.subarray(offset, offset + 8192));
  return btoa(text);
}
function decode(value: string): Uint8Array<ArrayBuffer> {
  if (!base64Pattern.test(value)) throw new Error("Invalid encoding");
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}
function parseKey(value: string, prefix: string, size: number) {
  const trimmed = value.trim();
  if (!trimmed.startsWith(prefix) || trimmed.length > 2000)
    throw new Error("Invalid key");
  const result = decode(trimmed.slice(prefix.length));
  if (result.length !== size) throw new Error("Invalid key length");
  return result;
}
async function fingerprint(publicKey: Uint8Array) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new Uint8Array(publicKey),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
async function derive(
  sharedSecret: Uint8Array,
  header: Header,
  usage: "encrypt" | "decrypt",
) {
  const material = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(sharedSecret),
    "HKDF",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: decode(header.salt),
      info: encoder.encode(`oknefq:v1:${suite}:${header.recipient}`),
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    [usage],
  );
}
export async function createFileIdentity() {
  const keys = kem.keygen();
  try {
    return {
      recipient: recipientPrefix + encode(keys.publicKey),
      recovery: recoveryPrefix + encode(keys.secretKey),
      fingerprint: await fingerprint(keys.publicKey),
    };
  } finally {
    keys.secretKey.fill(0);
  }
}
export async function recipientFingerprint(recipient: string) {
  return fingerprint(parseKey(recipient, recipientPrefix, 1216));
}
export async function sealFile(
  input: { name: string; type: string; data: Uint8Array },
  recipient: string,
) {
  if (input.data.byteLength > MAX_FILE_BYTES) throw new Error("File too large");
  const publicKey = parseKey(recipient, recipientPrefix, 1216);
  const { cipherText, sharedSecret } = kem.encapsulate(publicKey);
  const header: Header = {
    format: "oknefq",
    version: 1,
    suite,
    recipient: await fingerprint(publicKey),
    capsule: encode(cipherText),
    salt: encode(crypto.getRandomValues(new Uint8Array(32))),
    iv: encode(crypto.getRandomValues(new Uint8Array(12))),
  };
  const plaintext = encoder.encode(
    JSON.stringify(
      payloadSchema.parse({
        name: input.name,
        type: input.type,
        data: encode(input.data),
      }),
    ),
  );
  try {
    const key = await derive(sharedSecret, header, "encrypt");
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: decode(header.iv),
        additionalData: encoder.encode(JSON.stringify(header)),
        tagLength: 128,
      },
      key,
      plaintext,
    );
    return JSON.stringify({
      header,
      ciphertext: encode(new Uint8Array(ciphertext)),
    });
  } finally {
    sharedSecret.fill(0);
    plaintext.fill(0);
  }
}
export async function openFile(serialized: string, recovery: string) {
  if (serialized.length > MAX_ENVELOPE_BYTES)
    throw new Error("Envelope too large");
  const envelope = envelopeSchema.parse(JSON.parse(serialized));
  const secretKey = parseKey(recovery, recoveryPrefix, 32);
  let sharedSecret: Uint8Array | undefined;
  let plaintext: Uint8Array | undefined;
  try {
    if (
      (await fingerprint(kem.getPublicKey(secretKey))) !==
      envelope.header.recipient
    )
      throw new Error("Wrong recipient");
    sharedSecret = kem.decapsulate(decode(envelope.header.capsule), secretKey);
    const key = await derive(sharedSecret, envelope.header, "decrypt");
    plaintext = new Uint8Array(
      await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: decode(envelope.header.iv),
          additionalData: encoder.encode(JSON.stringify(envelope.header)),
          tagLength: 128,
        },
        key,
        decode(envelope.ciphertext),
      ),
    );
    const payload = payloadSchema.parse(
      JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(plaintext)),
    );
    const data = decode(payload.data);
    if (data.length > MAX_FILE_BYTES) throw new Error("Payload too large");
    return { name: payload.name, type: payload.type, data };
  } finally {
    secretKey.fill(0);
    sharedSecret?.fill(0);
    plaintext?.fill(0);
  }
}
