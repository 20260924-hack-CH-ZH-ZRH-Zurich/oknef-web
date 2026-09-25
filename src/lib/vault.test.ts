import { expect, test } from "bun:test";
import {
  createVaultKey,
  decryptSecret,
  encryptSecret,
  importVaultKey,
} from "./vault";

const secret = {
  name: "Fictional credential",
  secret: "test-secret-never-network-plaintext",
  notes: "Encrypted note",
};
test("vault round trip remains opaque and uses a fresh nonce for every write", async () => {
  const { key, recovery } = await createVaultKey();
  const first = await encryptSecret(key, secret);
  const second = await encryptSecret(key, secret);
  expect(first.iv).not.toBe(second.iv);
  expect(first.ciphertext).not.toBe(second.ciphertext);
  expect(JSON.stringify(first)).not.toContain(secret.secret);
  expect(JSON.stringify(first)).not.toContain(secret.name);
  expect(await decryptSecret(await importVaultKey(recovery), first)).toEqual(
    secret,
  );
});
test("vault rejects tampering, wrong keys, unsupported formats and malformed recovery keys", async () => {
  const { key } = await createVaultKey();
  const other = await createVaultKey();
  const envelope = await encryptSecret(key, secret);
  await expect(decryptSecret(other.key, envelope)).rejects.toThrow();
  await expect(
    decryptSecret(key, {
      ...envelope,
      ciphertext:
        (envelope.ciphertext[0] === "A" ? "B" : "A") +
        envelope.ciphertext.slice(1),
    }),
  ).rejects.toThrow();
  await expect(
    decryptSecret(key, { ...envelope, algorithm: "unknown" }),
  ).rejects.toThrow();
  await expect(importVaultKey("weak-password")).rejects.toThrow();
});
