import { expect, spyOn, test } from "bun:test";
import { NextRequest } from "next/server";
import { POST } from "./route";

test("Drive and media request budgets include real serialization overhead and remain route bounded", async () => {
  const previousOrigin = process.env.PUBLIC_ORIGIN;
  const previousBackend = process.env.OKNEF_BACKEND_URL;
  process.env.PUBLIC_ORIGIN = "https://oknef.example";
  process.env.OKNEF_BACKEND_URL = "http://backend.internal:8080";
  const fetcher = spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(null, { status: 200 }),
  );
  async function post(endpoint: string, body: BodyInit, contentType?: string) {
    return POST(
      new NextRequest(`http://0.0.0.0:3000/api/${endpoint}`, {
        method: "POST",
        headers: {
          origin: "https://oknef.example",
          ...(contentType ? { "content-type": contentType } : {}),
        },
        body,
      }),
      { params: Promise.resolve({ path: endpoint.split("/") }) },
    );
  }
  try {
    const file = Buffer.alloc(5_000_000, 97).toString("base64");
    const plaintext = JSON.stringify({
      name: "large-file.bin",
      mime: "application/octet-stream",
      data: file,
    });
    const envelope = JSON.stringify({
      envelope: {
        version: 1,
        algorithm: "AES-256-GCM",
        iv: Buffer.alloc(12).toString("base64"),
        ciphertext: Buffer.alloc(Buffer.byteLength(plaintext) + 16).toString(
          "base64",
        ),
      },
    });
    expect(Buffer.byteLength(envelope)).toBeGreaterThan(8_000_000);
    expect((await post("drive", envelope, "application/json")).status).toBe(
      200,
    );
    expect(
      Buffer.from(fetcher.mock.calls.at(-1)?.[1]?.body as Uint8Array)
        .byteLength,
    ).toBe(Buffer.byteLength(envelope));

    const audio = new FormData();
    audio.append(
      "file",
      new File([new Uint8Array(12_000_000)], "recording.wav", {
        type: "audio/wav",
      }),
    );
    audio.append("locale", "en");
    expect((await post("transcribe", audio)).status).toBe(200);
    expect(
      Buffer.from(fetcher.mock.calls.at(-1)?.[1]?.body as Uint8Array)
        .byteLength,
    ).toBeGreaterThan(12_000_000);

    const image = `data:image/png;base64,${Buffer.alloc(4_000_000).toString("base64")}`;
    expect(
      (
        await post(
          "ocr",
          JSON.stringify({
            image_data_url: image,
            locale: "en",
            prompt: "Read visible text",
          }),
          "application/json",
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await post(
          "media/analyze",
          JSON.stringify({
            kind: "identity",
            images: [image],
            locale: "en",
            context: "Synthetic image",
          }),
          "application/json",
        )
      ).status,
    ).toBe(200);

    for (const [endpoint, limit] of [
      ["drive", 12 * 1024 * 1024],
      ["media/analyze", 18_000_000 + 16_384],
      ["transcribe", 12_000_000 + 64_000],
      ["ocr", 6_000_000],
      ["chat", 100_000],
      ["vault", 100_000],
    ] as const) {
      const before = fetcher.mock.calls.length;
      const rejected = await post(
        endpoint,
        new Uint8Array(limit + 1),
        "application/octet-stream",
      );
      expect(rejected.status).toBe(413);
      expect(fetcher.mock.calls.length).toBe(before);
    }
  } finally {
    fetcher.mockRestore();
    if (previousOrigin === undefined) delete process.env.PUBLIC_ORIGIN;
    else process.env.PUBLIC_ORIGIN = previousOrigin;
    if (previousBackend === undefined) delete process.env.OKNEF_BACKEND_URL;
    else process.env.OKNEF_BACKEND_URL = previousBackend;
  }
});
