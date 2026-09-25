import { expect, test } from "bun:test";
import { parseCreation, parseRequest } from "./passkeys";

test("passkey options decode challenge bytes without accepting arbitrary fields", () => {
  const source = {
    publicKey: {
      challenge: "aGVsbG8",
      rp: { name: "Oknef", id: "localhost" },
      user: { id: "dXNlcg", name: "demo@example.test", displayName: "Demo" },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }],
      extensions: {
        credProps: true,
        uvm: true,
        credentialProtectionPolicy: "userVerificationRequired",
        enforceCredentialProtectionPolicy: false,
      },
    },
  };
  expect(
    new TextDecoder().decode(parseCreation(source).publicKey?.challenge),
  ).toBe("hello");
  expect(() =>
    parseCreation({ publicKey: { ...source.publicKey, untrusted: "execute" } }),
  ).toThrow();
  expect(() =>
    parseRequest({ publicKey: { challenge: "not valid!" } }),
  ).toThrow();
  expect(
    new TextDecoder().decode(
      parseRequest({
        publicKey: {
          challenge: "aGVsbG8",
          allowCredentials: [{ id: "dXNlcg", type: "public-key" }],
        },
      }).publicKey?.allowCredentials?.[0].id,
    ),
  ).toBe("user");
});
