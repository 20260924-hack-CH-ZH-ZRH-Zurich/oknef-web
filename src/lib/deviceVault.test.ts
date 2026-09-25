import { expect, test } from "bun:test";
import { openDeviceVault, sealDeviceVault } from "./deviceVault";
import { createVaultKey, decryptSecret, encryptSecret } from "./vault";

test("device envelope recovers the actual vault key without persisting plaintext", async () => {
  const { key, recovery } = await createVaultKey();
  const prf = crypto.getRandomValues(new Uint8Array(32)).buffer;
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const sealed = await sealDeviceVault(
    recovery,
    prf,
    "credential-test",
    salt,
    "tenant:user",
    "https://vault.example",
  );
  expect(JSON.stringify(sealed)).not.toContain(recovery);
  const secret = { name: "Test", secret: "local-only", notes: "" };
  const envelope = await encryptSecret(key, secret);
  const restored = await openDeviceVault(
    sealed,
    prf,
    "tenant:user",
    "https://vault.example",
  );
  expect(restored.extractable).toBe(false);
  expect(await decryptSecret(restored, envelope)).toEqual(secret);
});

test("device unlock fails for another account, origin, authenticator, or modified envelope", async () => {
  const { recovery } = await createVaultKey();
  const prf = crypto.getRandomValues(new Uint8Array(32)).buffer;
  const sealed = await sealDeviceVault(
    recovery,
    prf,
    "credential-test",
    crypto.getRandomValues(new Uint8Array(32)),
    "a:u",
    "https://vault.example",
  );
  await expect(
    openDeviceVault(sealed, prf, "b:u", "https://vault.example"),
  ).rejects.toThrow();
  await expect(
    openDeviceVault(sealed, prf, "a:u", "https://other.example"),
  ).rejects.toThrow();
  await expect(
    openDeviceVault(
      sealed,
      new Uint8Array(32).buffer,
      "a:u",
      "https://vault.example",
    ),
  ).rejects.toThrow();
  const changed = {
    ...sealed,
    ciphertext:
      (sealed.ciphertext[0] === "A" ? "B" : "A") + sealed.ciphertext.slice(1),
  };
  await expect(
    openDeviceVault(changed, prf, "a:u", "https://vault.example"),
  ).rejects.toThrow();
  await expect(
    openDeviceVault(
      { ...sealed, version: 2 },
      prf,
      "a:u",
      "https://vault.example",
    ),
  ).rejects.toThrow();
});

test("invalid recovery material and absent PRF cannot create a device unlock record", async () => {
  await expect(
    sealDeviceVault(
      "bad",
      new Uint8Array(32).buffer,
      "c",
      new Uint8Array(32),
      "u",
      "https://vault.example",
    ),
  ).rejects.toThrow();
  const { recovery } = await createVaultKey();
  await expect(
    sealDeviceVault(
      recovery,
      new Uint8Array(0).buffer,
      "c",
      new Uint8Array(32),
      "u",
      "https://vault.example",
    ),
  ).rejects.toThrow();
});
