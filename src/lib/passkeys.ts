import { z } from "zod";

const bufferString = z
  .string()
  .min(1)
  .max(100000)
  .regex(/^[A-Za-z0-9_-]+=*$/);
const descriptor = z
  .object({
    id: bufferString,
    type: z.literal("public-key"),
    transports: z
      .array(z.enum(["ble", "hybrid", "internal", "nfc", "usb"]))
      .optional(),
  })
  .strict();
const creation = z
  .object({
    challenge: bufferString,
    rp: z.object({ id: z.string().optional(), name: z.string() }).strict(),
    user: z
      .object({ id: bufferString, name: z.string(), displayName: z.string() })
      .strict(),
    pubKeyCredParams: z.array(
      z.object({ type: z.literal("public-key"), alg: z.number() }).strict(),
    ),
    timeout: z.number().optional(),
    excludeCredentials: z.array(descriptor).optional(),
    authenticatorSelection: z
      .object({
        authenticatorAttachment: z
          .enum(["platform", "cross-platform"])
          .optional(),
        residentKey: z
          .enum(["discouraged", "preferred", "required"])
          .optional(),
        requireResidentKey: z.boolean().optional(),
        userVerification: z
          .enum(["discouraged", "preferred", "required"])
          .optional(),
      })
      .strict()
      .optional(),
    attestation: z
      .enum(["none", "indirect", "direct", "enterprise"])
      .optional(),
    extensions: z
      .object({
        credProps: z.boolean().optional(),
        uvm: z.boolean().optional(),
        credentialProtectionPolicy: z
          .enum([
            "userVerificationOptional",
            "userVerificationOptionalWithCredentialIDList",
            "userVerificationRequired",
          ])
          .optional(),
        enforceCredentialProtectionPolicy: z.boolean().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();
const request = z
  .object({
    challenge: bufferString,
    timeout: z.number().optional(),
    rpId: z.string().optional(),
    allowCredentials: z.array(descriptor).optional(),
    userVerification: z
      .enum(["discouraged", "preferred", "required"])
      .optional(),
    extensions: z.object({ uvm: z.boolean().optional() }).strict().optional(),
  })
  .strict();
export function decodeBase64url(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(
    atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")),
    (character) => character.charCodeAt(0),
  );
}
function encodeBase64url(value: ArrayBuffer) {
  return btoa(
    Array.from(new Uint8Array(value), (byte) => String.fromCharCode(byte)).join(
      "",
    ),
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}
export function parseCreation(input: unknown): CredentialCreationOptions {
  const value = z
    .object({ publicKey: creation })
    .strict()
    .parse(input).publicKey;
  return {
    publicKey: {
      ...value,
      challenge: decodeBase64url(value.challenge),
      user: { ...value.user, id: decodeBase64url(value.user.id) },
      excludeCredentials: value.excludeCredentials?.map((item) => ({
        ...item,
        id: decodeBase64url(item.id),
      })),
    },
  };
}
export function parseRequest(input: unknown): CredentialRequestOptions {
  const value = z
    .object({ publicKey: request })
    .strict()
    .parse(input).publicKey;
  return {
    publicKey: {
      ...value,
      challenge: decodeBase64url(value.challenge),
      // uvm is parsed for protocol integrity but is not supported by browsers.
      extensions: undefined,
      allowCredentials: value.allowCredentials?.map((item) => ({
        ...item,
        id: decodeBase64url(item.id),
      })),
    },
  };
}
export function serializeCredential(value: Credential | null) {
  if (!(value instanceof PublicKeyCredential))
    throw new Error("Passkey unavailable");
  const response = value.response;
  const common = {
    id: value.id,
    rawId: encodeBase64url(value.rawId),
    type: value.type,
    extensions: value.getClientExtensionResults(),
  };
  if (response instanceof AuthenticatorAttestationResponse)
    return {
      ...common,
      response: {
        attestationObject: encodeBase64url(response.attestationObject),
        clientDataJSON: encodeBase64url(response.clientDataJSON),
        transports: response.getTransports(),
      },
    };
  if (response instanceof AuthenticatorAssertionResponse)
    return {
      ...common,
      response: {
        authenticatorData: encodeBase64url(response.authenticatorData),
        clientDataJSON: encodeBase64url(response.clientDataJSON),
        signature: encodeBase64url(response.signature),
        userHandle: response.userHandle
          ? encodeBase64url(response.userHandle)
          : null,
      },
    };
  throw new Error("Unsupported credential response");
}
