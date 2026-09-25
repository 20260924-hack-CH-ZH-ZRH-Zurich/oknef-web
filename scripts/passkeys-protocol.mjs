import assert from "node:assert/strict";
import {
  createHash,
  generateKeyPairSync,
  randomBytes,
  randomUUID,
  sign,
} from "node:crypto";

import { parseCreation, parseRequest } from "../src/lib/passkeys.ts";

const base = process.env.QA_BASE_URL;
if (!base) throw new Error("QA_BASE_URL required");
const origin = process.env.QA_ORIGIN || base;
const rpId = new URL(origin).hostname;
let cookie = "";
const checks = [];
const hash = (data) => createHash("sha256").update(data).digest();
const b64 = (data) => Buffer.from(data).toString("base64url");
async function call(path, data, expected = 200, requestOrigin = origin) {
  const response = await fetch(`${base}/api${path}`, {
    method: data === undefined ? "GET" : "POST",
    redirect: "manual",
    headers: {
      "content-type": "application/json",
      origin: requestOrigin,
      ...(cookie ? { cookie } : {}),
    },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  assert.equal(response.status, expected, `${path} unexpected HTTP status`);
  const header = response.headers.get("set-cookie");
  if (header) cookie = header.split(";")[0];
  return response.status === 204 ? null : response.json();
}
function length(major, value) {
  if (value < 24) return Buffer.from([(major << 5) | value]);
  if (value < 256) return Buffer.from([(major << 5) | 24, value]);
  const out = Buffer.alloc(3);
  out[0] = (major << 5) | 25;
  out.writeUInt16BE(value, 1);
  return out;
}
function cbor(value) {
  if (typeof value === "number")
    return length(value >= 0 ? 0 : 1, value >= 0 ? value : -1 - value);
  if (Buffer.isBuffer(value))
    return Buffer.concat([length(2, value.length), value]);
  if (typeof value === "string") {
    const bytes = Buffer.from(value);
    return Buffer.concat([length(3, bytes.length), bytes]);
  }
  if (value instanceof Map)
    return Buffer.concat([
      length(5, value.size),
      ...[...value].flatMap(([key, item]) => [cbor(key), cbor(item)]),
    ]);
  throw new Error("Unsupported test CBOR type");
}
const email = `passkey-protocol-${randomUUID()}@example.test`;
const identity = await call("/auth/register", {
  name: "Software authenticator verification",
  email,
  password: `Verification-${randomUUID()}`,
  account_type: "personal",
});
const { privateKey, publicKey } = generateKeyPairSync("ec", {
  namedCurve: "prime256v1",
});
const jwk = publicKey.export({ format: "jwk" });
const credentialId = randomBytes(32);
const key = cbor(
  new Map([
    [1, 2],
    [3, -7],
    [-1, 1],
    [-2, Buffer.from(jwk.x, "base64url")],
    [-3, Buffer.from(jwk.y, "base64url")],
  ]),
);
const count = (value) => {
  const result = Buffer.alloc(4);
  result.writeUInt32BE(value);
  return result;
};
const start = await call("/passkeys/register/start", {});
assert.equal(start.options.publicKey.rp.id, rpId);
assert.equal(parseCreation(start.options).publicKey.rp.id, rpId);
assert.equal(
  start.options.publicKey.authenticatorSelection.userVerification,
  "required",
);
const clientData = Buffer.from(
  JSON.stringify({
    type: "webauthn.create",
    challenge: start.options.publicKey.challenge,
    origin,
    crossOrigin: false,
  }),
);
const credentialLength = Buffer.alloc(2);
credentialLength.writeUInt16BE(credentialId.length);
const authData = Buffer.concat([
  hash(rpId),
  Buffer.from([0x45]),
  count(0),
  Buffer.alloc(16),
  credentialLength,
  credentialId,
  key,
]);
const attestation = cbor(
  new Map([
    ["fmt", "none"],
    ["attStmt", new Map()],
    ["authData", authData],
  ]),
);
const registration = {
  challenge_id: start.challenge_id,
  credential: {
    id: b64(credentialId),
    rawId: b64(credentialId),
    type: "public-key",
    extensions: {},
    response: {
      attestationObject: b64(attestation),
      clientDataJSON: b64(clientData),
      transports: ["internal"],
    },
  },
};
assert.equal(
  (await call("/passkeys/register/finish", registration)).registered,
  true,
);
checks.push("P-256 registration and UV-required challenge");
await call("/passkeys/register/finish", registration, 401);
checks.push("registration challenge replay rejected");
await call("/auth/logout", {}, 204);
let counter = 0;
async function assertion({
  clientOrigin = origin,
  authRp = rpId,
  uv = true,
  tamper = false,
  headerOrigin = origin,
  success = false,
} = {}) {
  const challenge = await call("/passkeys/login/start", { email });
  assert.equal(parseRequest(challenge.options).publicKey.rpId, rpId);
  assert.equal(challenge.options.publicKey.userVerification, "required");
  const client = Buffer.from(
    JSON.stringify({
      type: "webauthn.get",
      challenge: challenge.options.publicKey.challenge,
      origin: clientOrigin,
      crossOrigin: false,
    }),
  );
  const authenticator = Buffer.concat([
    hash(authRp),
    Buffer.from([uv ? 0x05 : 0x01]),
    count(++counter),
  ]);
  const signature = sign(
    "sha256",
    Buffer.concat([authenticator, hash(client)]),
    privateKey,
  );
  if (tamper) signature[signature.length - 1] ^= 1;
  const body = {
    challenge_id: challenge.challenge_id,
    credential: {
      id: b64(credentialId),
      rawId: b64(credentialId),
      type: "public-key",
      extensions: {},
      response: {
        authenticatorData: b64(authenticator),
        clientDataJSON: b64(client),
        signature: b64(signature),
        userHandle: null,
      },
    },
  };
  const result = await call(
    "/passkeys/login/finish",
    body,
    success ? 200 : headerOrigin !== origin ? 403 : 401,
    headerOrigin,
  );
  return { body, result };
}
await assertion({ clientOrigin: "https://untrusted.example" });
checks.push("signed wrong client origin rejected");
await assertion({ authRp: "untrusted.example" });
checks.push("signed wrong RP hash rejected");
await assertion({ uv: false });
checks.push("signed assertion without user verification rejected");
await assertion({ tamper: true });
checks.push("tampered ECDSA signature rejected");
await assertion({ headerOrigin: "https://untrusted.example" });
checks.push("untrusted HTTP origin rejected");
const login = await assertion({ success: true });
assert.equal(login.result.user.id, identity.user.id);
assert.equal((await call("/auth/me")).user.id, identity.user.id);
checks.push("signed P-256 authentication creates real session");
await call("/passkeys/login/finish", login.body, 401);
checks.push("authentication challenge replay rejected");
console.info(
  JSON.stringify(
    {
      passed: checks.length,
      checks,
      authenticator: "software-protocol",
      browserCeremonyTested: false,
      physicalBiometricsTested: false,
    },
    null,
    2,
  ),
);
