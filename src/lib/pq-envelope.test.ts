import { describe, expect, test } from "bun:test";
import {
  createFileIdentity,
  MAX_FILE_BYTES,
  openFile,
  recipientFingerprint,
  sealFile,
} from "./pq-envelope";

describe("local hybrid file envelope", () => {
  test("round trip protects both filename and payload, with fresh encryption", async () => {
    const identity = await createFileIdentity();
    const input = {
      name: "private-inventory.txt",
      type: "text/plain",
      data: new TextEncoder().encode("private evidence"),
    };
    const first = await sealFile(input, identity.recipient);
    const second = await sealFile(input, identity.recipient);
    expect(first).not.toBe(second);
    expect(first).not.toContain(input.name);
    expect(first).not.toContain("private evidence");
    expect(await recipientFingerprint(identity.recipient)).toBe(
      identity.fingerprint,
    );
    const result = await openFile(first, identity.recovery);
    expect(result.name).toBe(input.name);
    expect(result.data).toEqual(input.data);
  });
  test("rejects another recipient, modified ciphertext, capsule and downgrade", async () => {
    const identity = await createFileIdentity();
    const other = await createFileIdentity();
    const sealed = await sealFile(
      {
        name: "evidence.txt",
        type: "text/plain",
        data: new Uint8Array([1, 2, 3]),
      },
      identity.recipient,
    );
    await expect(openFile(sealed, other.recovery)).rejects.toThrow();
    for (const path of [
      "ciphertext",
      "capsule",
      "salt",
      "iv",
      "recipient",
      "version",
    ]) {
      const edited = JSON.parse(sealed);
      if (path === "version") edited.header.version = 0;
      else {
        const owner = path === "ciphertext" ? edited : edited.header;
        owner[path] =
          (owner[path][0] === "A" ? "B" : "A") + owner[path].slice(1);
      }
      await expect(
        openFile(JSON.stringify(edited), identity.recovery),
      ).rejects.toThrow();
    }
  });
  test("rejects malformed formats, unknown fields and oversized files", async () => {
    const identity = await createFileIdentity();
    await expect(
      openFile('{"header":{}}', identity.recovery),
    ).rejects.toThrow();
    await expect(
      sealFile(
        { name: "big", type: "", data: new Uint8Array(MAX_FILE_BYTES + 1) },
        identity.recipient,
      ),
    ).rejects.toThrow();
    const serialized = await sealFile(
      { name: "empty", type: "", data: new Uint8Array() },
      identity.recipient,
    );
    expect((await openFile(serialized, identity.recovery)).data.length).toBe(0);
    await expect(openFile(serialized, "not-a-key")).rejects.toThrow();
    await expect(
      openFile(
        JSON.stringify({ ...JSON.parse(serialized), instruction: "override" }),
        identity.recovery,
      ),
    ).rejects.toThrow();
  });
});
