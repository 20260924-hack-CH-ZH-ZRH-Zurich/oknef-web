import { expect, test } from "bun:test";
import { qrImageFromExport } from "./importEvidence";

test("extension import uses PNG bytes and ignores claimed destination or verdict", async () => {
  const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const bundle = {
    schema: "oknef.local-qr-evidence.v1",
    captured_at: "2026-09-25T00:00:00Z",
    content: "https://forged.example",
    evidence: { sha256: "forged" },
    image_data_url: `data:image/png;base64,${Buffer.from(png).toString("base64")}`,
    assessment: { authenticity_verified: true },
  };
  const result = await qrImageFromExport(
    new File([JSON.stringify(bundle)], "evidence.json"),
  );
  expect(new Uint8Array(await result.arrayBuffer())).toEqual(png);
  expect(result.type).toBe("image/png");
  await expect(
    qrImageFromExport(
      new File(
        [
          JSON.stringify({
            ...bundle,
            image_data_url: "https://evil.example/image.png",
          }),
        ],
        "evidence.json",
      ),
    ),
  ).rejects.toThrow();
});
