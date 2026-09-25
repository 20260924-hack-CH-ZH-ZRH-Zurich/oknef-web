import { z } from "zod";
import { decodeBase64url } from "./passkeys";
import { base64, bytes, importVaultKey } from "./vault";

const encoder = new TextEncoder();
const sealedSchema = z
  .object({
    version: z.literal(1),
    credential: z
      .string()
      .min(1)
      .max(2048)
      .regex(/^[A-Za-z0-9_-]+$/),
    salt: z.string().regex(/^[A-Za-z0-9+/]{43}=$/),
    iv: z.string().regex(/^[A-Za-z0-9+/]{16}$/),
    ciphertext: z
      .string()
      .min(24)
      .max(512)
      .regex(/^[A-Za-z0-9+/]+={0,2}$/),
  })
  .strict();
export type DeviceVault = z.infer<typeof sealedSchema>;
type PrfInputs = AuthenticationExtensionsClientInputs & {
  prf: { eval: { first: Uint8Array<ArrayBuffer> } };
};
type PrfOutputs = AuthenticationExtensionsClientOutputs & {
  prf?: { enabled?: boolean; results?: { first?: ArrayBuffer } };
};

function binding(owner: string, origin: string) {
  if (!owner || !origin) throw new Error("invalid_device_binding");
  return encoder.encode(
    JSON.stringify(["oknef:device-vault:v1", origin, owner]),
  );
}

async function wrappingKey(prf: ArrayBuffer, salt: Uint8Array<ArrayBuffer>) {
  if (prf.byteLength !== 32 || salt.byteLength !== 32)
    throw new Error("invalid_prf_result");
  const material = await crypto.subtle.importKey("raw", prf, "HKDF", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt,
      info: encoder.encode("oknef:device-vault:wrap:v1"),
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function sealDeviceVault(
  recovery: string,
  prf: ArrayBuffer,
  credential: string,
  salt: Uint8Array<ArrayBuffer>,
  owner: string,
  origin: string,
): Promise<DeviceVault> {
  await importVaultKey(recovery);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = encoder.encode(recovery.trim());
  try {
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: binding(owner, origin) },
      await wrappingKey(prf, salt),
      plaintext,
    );
    return sealedSchema.parse({
      version: 1,
      credential,
      salt: base64(salt),
      iv: base64(iv),
      ciphertext: base64(new Uint8Array(ciphertext)),
    });
  } finally {
    plaintext.fill(0);
  }
}

export async function openDeviceVault(
  input: unknown,
  prf: ArrayBuffer,
  owner: string,
  origin: string,
) {
  const sealed = sealedSchema.parse(input);
  const plaintext = new Uint8Array(
    await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: bytes(sealed.iv),
        additionalData: binding(owner, origin),
      },
      await wrappingKey(prf, bytes(sealed.salt)),
      bytes(sealed.ciphertext),
    ),
  );
  try {
    return await importVaultKey(new TextDecoder().decode(plaintext));
  } finally {
    plaintext.fill(0);
  }
}

function storageKey(owner: string) {
  return `oknef-device-vault-v1:${owner}`;
}
export function readDeviceVault(owner: string): DeviceVault | null {
  try {
    const value = localStorage.getItem(storageKey(owner));
    return value ? sealedSchema.parse(JSON.parse(value)) : null;
  } catch {
    return null;
  }
}
export function forgetDeviceVault(owner: string) {
  localStorage.removeItem(storageKey(owner));
}

function credential(value: Credential | null): PublicKeyCredential {
  if (!(value instanceof PublicKeyCredential))
    throw new Error("passkey_unavailable");
  return value;
}
function output(value: PublicKeyCredential) {
  return (value.getClientExtensionResults() as PrfOutputs).prf;
}
async function evaluate(
  id: string,
  salt: Uint8Array<ArrayBuffer>,
  signal?: AbortSignal,
) {
  const value = credential(
    await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rpId: window.location.hostname,
        allowCredentials: [{ type: "public-key", id: decodeBase64url(id) }],
        userVerification: "required",
        timeout: 60000,
        extensions: { prf: { eval: { first: salt } } } as PrfInputs,
      },
      signal,
    }),
  );
  if (value.id !== id) throw new Error("credential_mismatch");
  const result = output(value)?.results?.first;
  if (!result || result.byteLength !== 32) throw new Error("prf_unavailable");
  return result;
}

export async function enrollDeviceVault(
  owner: string,
  recovery: string,
  signal?: AbortSignal,
) {
  if (!window.isSecureContext || !navigator.credentials)
    throw new Error("passkey_unavailable");
  await importVaultKey(recovery);
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const userId = await crypto.subtle.digest(
    "SHA-256",
    binding(owner, window.location.origin),
  );
  const value = credential(
    await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: "Oknef encrypted vault", id: window.location.hostname },
        user: {
          id: userId,
          name: `Vault ${owner.slice(-8)}`,
          displayName: "Oknef vault unlock",
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 },
        ],
        authenticatorSelection: {
          residentKey: "required",
          userVerification: "required",
        },
        timeout: 60000,
        attestation: "none",
        extensions: { prf: { eval: { first: salt } } } as PrfInputs,
      },
      signal,
    }),
  );
  if (!output(value)?.enabled) throw new Error("prf_unavailable");
  const prf =
    output(value)?.results?.first ?? (await evaluate(value.id, salt, signal));
  try {
    const sealed = await sealDeviceVault(
      recovery,
      prf,
      value.id,
      salt,
      owner,
      window.location.origin,
    );
    signal?.throwIfAborted();
    localStorage.setItem(storageKey(owner), JSON.stringify(sealed));
  } finally {
    new Uint8Array(prf).fill(0);
  }
}

export async function unlockDeviceVault(owner: string, signal?: AbortSignal) {
  const sealed = readDeviceVault(owner);
  if (!sealed) throw new Error("device_vault_missing");
  const prf = await evaluate(sealed.credential, bytes(sealed.salt), signal);
  try {
    const key = await openDeviceVault(
      sealed,
      prf,
      owner,
      window.location.origin,
    );
    signal?.throwIfAborted();
    return key;
  } finally {
    new Uint8Array(prf).fill(0);
  }
}
