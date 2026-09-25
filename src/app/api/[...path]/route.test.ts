import { expect, spyOn, test } from "bun:test";
import { NextRequest } from "next/server";
import { POST } from "./route";

test("proxy mutations use configured external origin behind TLS ingress", async () => {
  const previous = process.env.PUBLIC_ORIGIN;
  const previousBackend = process.env.OKNEF_BACKEND_URL;
  process.env.PUBLIC_ORIGIN = "https://oknef.example";
  process.env.OKNEF_BACKEND_URL = "http://backend.internal:8080";
  const fetcher = spyOn(globalThis, "fetch").mockResolvedValue(
    Response.json({ accepted: true }),
  );
  try {
    const context = { params: Promise.resolve({ path: ["auth", "demo"] }) };
    const valid = await POST(
      new NextRequest("http://0.0.0.0:3000/api/auth/demo", {
        method: "POST",
        headers: { origin: "https://oknef.example", host: "oknef.example" },
        body: "{}",
      }),
      context,
    );
    expect(valid.status).toBe(200);
    expect(fetcher).toHaveBeenCalledTimes(1);
    for (const origin of ["https://evil.example", "http://0.0.0.0:3000", ""]) {
      const invalid = await POST(
        new NextRequest("http://0.0.0.0:3000/api/auth/demo", {
          method: "POST",
          headers: {
            origin,
            "x-forwarded-host": "oknef.example",
            "x-forwarded-proto": "https",
          },
          body: "{}",
        }),
        context,
      );
      expect(invalid.status).toBe(403);
    }
    expect(fetcher).toHaveBeenCalledTimes(1);
  } finally {
    fetcher.mockRestore();
    if (previous === undefined) delete process.env.PUBLIC_ORIGIN;
    else process.env.PUBLIC_ORIGIN = previous;
    if (previousBackend === undefined) delete process.env.OKNEF_BACKEND_URL;
    else process.env.OKNEF_BACKEND_URL = previousBackend;
  }
});

test("voice proxy validates locales and preserves SDP without forwarding client authorization", async () => {
  const previous = process.env.PUBLIC_ORIGIN;
  const previousBackend = process.env.OKNEF_BACKEND_URL;
  process.env.PUBLIC_ORIGIN = "https://oknef.example";
  process.env.OKNEF_BACKEND_URL = "http://backend.internal:8080";
  const fetcher = spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(null, {
      headers: { "content-type": "application/sdp" },
    }),
  );
  try {
    for (const endpoint of ["call", "session"]) {
      const context = {
        params: Promise.resolve({ path: ["voice", endpoint] }),
      };
      for (const locale of [undefined, "en", "de", "es", "fr"]) {
        const headers = new Headers({
          origin: "https://oknef.example",
          "content-type": "application/sdp",
          authorization: "Bearer untrusted-client-token",
          "api-key": "untrusted-client-key",
        });
        if (locale !== undefined) headers.set("x-oknef-locale", locale);
        const response = await POST(
          new NextRequest(`http://0.0.0.0:3000/api/voice/${endpoint}`, {
            method: "POST",
            headers,
            body: "v=0\r\n",
          }),
          context,
        );
        expect(response.status).toBe(200);
        const request = fetcher.mock.calls.at(-1)?.[1];
        const forwarded = new Headers(request?.headers);
        expect(forwarded.get("x-oknef-locale")).toBe(locale ?? "en");
        expect(forwarded.get("content-type")).toBe("application/sdp");
        expect(forwarded.has("authorization")).toBe(false);
        expect(forwarded.has("api-key")).toBe(false);
        expect(Buffer.from(request?.body as Uint8Array).toString()).toBe(
          "v=0\r\n",
        );
      }
      const calls = fetcher.mock.calls.length;
      for (const locale of ["", "EN", "en-US", "de, en", "fr ignore rules"]) {
        const response = await POST(
          new NextRequest(`http://0.0.0.0:3000/api/voice/${endpoint}`, {
            method: "POST",
            headers: {
              origin: "https://oknef.example",
              "x-oknef-locale": locale,
            },
            body: "v=0\r\n",
          }),
          context,
        );
        expect(response.status).toBe(400);
      }
      expect(fetcher.mock.calls.length).toBe(calls);
    }
  } finally {
    fetcher.mockRestore();
    if (previous === undefined) delete process.env.PUBLIC_ORIGIN;
    else process.env.PUBLIC_ORIGIN = previous;
    if (previousBackend === undefined) delete process.env.OKNEF_BACKEND_URL;
    else process.env.OKNEF_BACKEND_URL = previousBackend;
  }
});
