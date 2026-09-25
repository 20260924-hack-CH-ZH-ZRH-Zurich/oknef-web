import { expect, test } from "bun:test";
import { fingerprint } from "@/features/evidence/localStore";
import { integrationSchema, voicePolicySchema } from "./contracts";
import { productMessages } from "./messages";

test("connection registration cannot be promoted into authenticated provider access", () => {
  const value = {
    id: "record",
    provider: "mail",
    name: "Mailbox",
    account_label: "Personal",
    asset_ids: [],
    status: "registered",
    connection_verified: false,
    background_sync: false,
    credential_storage: false,
    created_at: 1790352000,
    created_by: "user",
    synthetic: false,
  };
  expect(integrationSchema.safeParse(value).success).toBe(true);
  expect(
    integrationSchema.safeParse({ ...value, connection_verified: true })
      .success,
  ).toBe(false);
  expect(
    integrationSchema.safeParse({ ...value, access_token: "forged" }).success,
  ).toBe(false);
});
test("voice policy cannot claim unavailable biometrics", () => {
  const policy = {
    mode: "trusted_only",
    speaker_verification_available: false,
    deepfake_detection_available: false,
    session_allowed: false,
    authority: "signed_in_session",
    effect: "blocked",
  };
  expect(voicePolicySchema.safeParse(policy).success).toBe(true);
  expect(
    voicePolicySchema.safeParse({
      ...policy,
      speaker_verification_available: true,
    }).success,
  ).toBe(false);
});
test("all new user-facing labels have four complete language siblings", () => {
  const keys = Object.keys(productMessages.en).sort();
  for (const locale of ["es", "de", "fr"] as const)
    expect(Object.keys(productMessages[locale]).sort()).toEqual(keys);
});
test("evidence digest reflects bytes and strips recording codec parameters", async () => {
  const file = new File(["abc"], "recording.webm", {
    type: "audio/webm;codecs=opus",
  });
  const value = await fingerprint(file, "microphone");
  expect(value.sha256).toBe(
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
  expect(value.mime_type).toBe("audio/webm");
  expect(value.size_bytes).toBe(3);
  expect(value.source).toBe("microphone");
});
