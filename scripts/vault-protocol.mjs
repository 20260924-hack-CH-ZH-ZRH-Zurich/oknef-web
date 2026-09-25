import assert from "node:assert/strict";
import {
  createVaultKey,
  decryptSecret,
  encryptSecret,
  importVaultKey,
} from "../src/lib/vault.ts";

const base = process.env.QA_BASE_URL;
if (!base) throw new Error("QA_BASE_URL required");
const origin = process.env.QA_ORIGIN || base;
async function request(
  path,
  method = "GET",
  body,
  cookie = "",
  expected = 200,
) {
  const serialized = body === undefined ? undefined : JSON.stringify(body);
  const response = await fetch(`${base}/api${path}`, {
    method,
    redirect: "manual",
    headers: {
      origin,
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: serialized,
  });
  assert.equal(response.status, expected, `${method} ${path}`);
  return {
    value: response.status === 204 ? null : await response.json(),
    cookie: response.headers.get("set-cookie")?.split(";")[0],
  };
}
const first = await request("/auth/demo", "POST", {});
const second = await request("/auth/demo", "POST", {});
const { key, recovery } = await createVaultKey();
const secret = {
  name: "Fictional private record",
  secret: "FICTIONAL-SECRET-FOR-TEST-ONLY",
  notes: "Not a real credential",
};
const envelope = await encryptSecret(key, secret);
for (const value of [secret.name, secret.secret, secret.notes, recovery])
  assert(!JSON.stringify(envelope).includes(value));
const saved = await request("/vault", "POST", { envelope }, first.cookie);
const list = await request("/vault", "GET", undefined, first.cookie);
const record = list.value.items.find((item) => item.id === saved.value.id);
assert(record);
for (const value of [secret.name, secret.secret, secret.notes, recovery])
  assert(!JSON.stringify(list.value).includes(value));
assert.deepEqual(
  await decryptSecret(await importVaultKey(recovery), record.envelope),
  secret,
);
const other = await request("/vault", "GET", undefined, second.cookie);
assert(!other.value.items.some((item) => item.id === saved.value.id));
const wrong = await createVaultKey();
await assert.rejects(() => decryptSecret(wrong.key, record.envelope));
await request(`/vault/${saved.value.id}`, "DELETE", undefined, first.cookie);
const final = await request("/vault", "GET", undefined, first.cookie);
assert(!final.value.items.some((item) => item.id === saved.value.id));
console.info(
  JSON.stringify(
    {
      passed: 6,
      checks: [
        "client AES-256-GCM encryption before request",
        "server opaque persistence with no plaintext or key",
        "recovery import and local decryption",
        "tenant isolation",
        "wrong key rejected",
        "record deletion",
      ],
      browserStorageInspection: false,
    },
    null,
    2,
  ),
);
