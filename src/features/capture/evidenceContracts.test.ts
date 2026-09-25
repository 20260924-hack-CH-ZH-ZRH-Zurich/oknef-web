import { expect, test } from "bun:test";
import { sessionSchema } from "@/features/security/contracts";

const evidence = {
  id: "file",
  name: "document.png",
  mime_type: "image/png",
  size_bytes: 8,
  sha256: "a".repeat(64),
  source: "upload",
  captured_at: 1,
  bytes_retained: false,
};
const schema = sessionSchema.shape.evidence;
test("received bytes can verify a digest without authenticating the source or extraction", () => {
  const received = {
    ...evidence,
    provenance: "server_received_upload",
    digest_verified: true,
    received_at: 2,
    source_verified: false,
    content_provenance: "user_reviewed_extraction",
  };
  expect(schema.safeParse([received]).success).toBe(true);
  expect(
    schema.safeParse([{ ...received, source_verified: true }]).success,
  ).toBe(false);
  expect(
    schema.safeParse([{ ...received, content_provenance: "verified_identity" }])
      .success,
  ).toBe(false);
});
test("client-reported hashes cannot claim server verification", () => {
  expect(
    schema.safeParse([
      {
        ...evidence,
        provenance: "client_reported_metadata",
        digest_verified: false,
      },
    ]).success,
  ).toBe(true);
  expect(
    schema.safeParse([
      {
        ...evidence,
        provenance: "client_reported_metadata",
        digest_verified: true,
      },
    ]).success,
  ).toBe(false);
});
