import { expect, spyOn, test } from "bun:test";
import { NextRequest } from "next/server";
import { GET, OPTIONS, POST } from "./route";

test("gateway admits only the configured extension and retains authenticated backend isolation", async () => {
  const names = [
    "PUBLIC_ORIGIN",
    "OKNEF_BACKEND_URL",
    "OKNEF_EXTENSION_ORIGIN",
  ] as const;
  const previous = names.map((name) => process.env[name]);
  process.env.PUBLIC_ORIGIN = "https://workspace.example";
  process.env.OKNEF_BACKEND_URL = "http://backend.internal";
  process.env.OKNEF_EXTENSION_ORIGIN = `chrome-extension://${"a".repeat(32)}`;
  const extension = process.env.OKNEF_EXTENSION_ORIGIN;
  const fetcher = spyOn(globalThis, "fetch").mockResolvedValue(
    Response.json({ accepted: true }),
  );
  const context = { params: Promise.resolve({ path: ["auth", "demo"] }) };
  try {
    const response = await POST(
      new NextRequest("https://workspace.example/api/auth/demo", {
        method: "POST",
        headers: {
          origin: extension,
          cookie: "oknef_session=test-opaque",
          "content-type": "application/json",
        },
        body: "{}",
      }),
      context,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBe(extension);
    expect(response.headers.get("access-control-allow-credentials")).toBe(
      "true",
    );
    const headers = new Headers(fetcher.mock.calls[0]?.[1]?.headers);
    expect(headers.get("origin")).toBe("https://workspace.example");
    expect(headers.get("cookie")).toBe("oknef_session=test-opaque");
    const preflight = await OPTIONS(
      new NextRequest("https://workspace.example/api/auth/demo", {
        method: "OPTIONS",
        headers: { origin: extension },
      }),
      context,
    );
    expect(preflight.status).toBe(204);
    for (const origin of [
      `chrome-extension://${"b".repeat(32)}`,
      "null",
      `${extension}.evil.example`,
      "https://evil.example",
    ]) {
      const rejected = await GET(
        new NextRequest("https://workspace.example/api/auth/demo", {
          headers: { origin },
        }),
        context,
      );
      expect(rejected.status).toBe(403);
    }
    expect(fetcher).toHaveBeenCalledTimes(1);
    delete process.env.OKNEF_EXTENSION_ORIGIN;
    const disabled = await POST(
      new NextRequest("https://workspace.example/api/auth/demo", {
        method: "POST",
        headers: { origin: extension },
        body: "{}",
      }),
      context,
    );
    expect(disabled.status).toBe(403);
  } finally {
    fetcher.mockRestore();
    names.forEach((name, index) => {
      if (previous[index] === undefined) delete process.env[name];
      else process.env[name] = previous[index];
    });
  }
});
