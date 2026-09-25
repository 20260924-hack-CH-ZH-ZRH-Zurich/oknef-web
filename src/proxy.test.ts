import { expect, test } from "bun:test";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

test("locale paths rewrite to actual pages with validated locale and retained query", () => {
  const previous = process.env.PUBLIC_ORIGIN;
  const previousBackend = process.env.OKNEF_BACKEND_URL;
  process.env.OKNEF_BACKEND_URL = "http://backend.internal:8080";
  process.env.PUBLIC_ORIGIN = "https://oknef.example";
  try {
    for (const locale of ["en", "de", "es", "fr"]) {
      const response = proxy(
        new NextRequest(
          `https://oknef.example/${locale}/workspace?view=security`,
          { headers: { host: "oknef.example", "x-oknef-locale": "invalid" } },
        ),
      );
      expect(response.headers.get("x-middleware-rewrite")).toBe(
        "https://oknef.example/workspace?view=security",
      );
      expect(response.headers.get("x-middleware-request-x-oknef-locale")).toBe(
        locale,
      );
      expect(response.headers.get("content-security-policy")).toContain(
        "'strict-dynamic'",
      );
    }
    const root = proxy(
      new NextRequest("https://oknef.example/de/", {
        headers: { host: "oknef.example" },
      }),
    );
    expect(root.headers.get("x-middleware-rewrite")).toBe(
      "https://oknef.example/",
    );
    const untrusted = proxy(
      new NextRequest("https://oknef.example/", {
        headers: { host: "oknef.example", "x-oknef-locale": "de" },
      }),
    );
    expect(
      untrusted.headers.get("x-middleware-request-x-oknef-locale"),
    ).toBeNull();
    const voice = proxy(
      new NextRequest("https://oknef.example/api/voice/call", {
        headers: { host: "oknef.example", "x-oknef-locale": "fr" },
      }),
    );
    expect(voice.headers.get("x-middleware-request-x-oknef-locale")).toBe("fr");
  } finally {
    if (previous === undefined) delete process.env.PUBLIC_ORIGIN;
    else process.env.PUBLIC_ORIGIN = previous;
    if (previousBackend === undefined) delete process.env.OKNEF_BACKEND_URL;
    else process.env.OKNEF_BACKEND_URL = previousBackend;
  }
});

test("each HTML response has a unique strict nonce and no-cache security headers", () => {
  const previous = process.env.PUBLIC_ORIGIN;
  const previousBackend = process.env.OKNEF_BACKEND_URL;
  process.env.OKNEF_BACKEND_URL = "http://backend.internal:8080";
  process.env.PUBLIC_ORIGIN = "https://oknef.example";
  const first = proxy(
    new NextRequest("http://0.0.0.0:3000/workspace", {
      headers: { host: "oknef.example" },
    }),
  );
  const second = proxy(
    new NextRequest("http://0.0.0.0:3000/workspace", {
      headers: { host: "oknef.example" },
    }),
  );
  const policy = first.headers.get("content-security-policy") || "";
  if (previous === undefined) delete process.env.PUBLIC_ORIGIN;
  else process.env.PUBLIC_ORIGIN = previous;
  if (previousBackend === undefined) delete process.env.OKNEF_BACKEND_URL;
  else process.env.OKNEF_BACKEND_URL = previousBackend;
  expect(policy).toContain("'strict-dynamic'");
  expect(policy).toContain("frame-ancestors 'none'");
  expect(policy).not.toContain("unsafe-inline");
  expect(policy).not.toContain("unsafe-eval");
  expect(policy).not.toBe(second.headers.get("content-security-policy"));
  expect(first.headers.get("cache-control")).toBe("no-store");
  expect(first.headers.get("permissions-policy")).toContain(
    "microphone=(self)",
  );
});

test("canonical redirects use only the configured target and exclude API and static resources", () => {
  const previous = process.env.PUBLIC_ORIGIN;
  const previousBackend = process.env.OKNEF_BACKEND_URL;
  process.env.OKNEF_BACKEND_URL = "http://backend.internal:8080";
  process.env.PUBLIC_ORIGIN = "https://oknef.example";
  try {
    const alias = proxy(
      new NextRequest("http://internal:3000/workspace?view=assistant", {
        headers: {
          host: "www.oknef.example",
          "x-forwarded-host": "evil.example",
        },
      }),
    );
    expect(alias.status).toBe(308);
    expect(alias.headers.get("location")).toBe(
      "https://oknef.example/workspace?view=assistant",
    );
    for (const path of [
      "/api/health",
      "/api/auth/demo",
      "/icon.svg",
      "/_next/static/chunk.js",
    ]) {
      const response = proxy(
        new NextRequest(`http://internal:3000${path}`, {
          headers: { host: "alias.example" },
        }),
      );
      expect(response.headers.has("location")).toBe(false);
    }
    expect(
      proxy(
        new NextRequest("http://internal:3000/workspace", {
          method: "POST",
          headers: { host: "alias.example" },
        }),
      ).headers.has("location"),
    ).toBe(false);
  } finally {
    if (previous === undefined) delete process.env.PUBLIC_ORIGIN;
    else process.env.PUBLIC_ORIGIN = previous;
    if (previousBackend === undefined) delete process.env.OKNEF_BACKEND_URL;
    else process.env.OKNEF_BACKEND_URL = previousBackend;
  }
});

test("capture is restricted to workspace and Vimeo frames to deck routes", () => {
  const previous = process.env.PUBLIC_ORIGIN;
  const backend = process.env.OKNEF_BACKEND_URL;
  process.env.PUBLIC_ORIGIN = "https://oknef.example";
  process.env.OKNEF_BACKEND_URL = "http://backend.internal:8080";
  try {
    const response = (path: string) =>
      proxy(
        new NextRequest(`https://oknef.example${path}`, {
          headers: { host: "oknef.example" },
        }),
      );
    expect(
      response("/de/workspace").headers.get("permissions-policy"),
    ).toContain("camera=(self)");
    expect(response("/login").headers.get("permissions-policy")).toContain(
      "camera=()",
    );
    expect(
      response("/en/deck/JO202609240900").headers.get(
        "content-security-policy",
      ),
    ).toContain("frame-src https://player.vimeo.com");
    expect(
      response("/workspace").headers.get("content-security-policy"),
    ).toContain("frame-src 'none'");
    expect(
      response("/workspace").headers.get("cross-origin-embedder-policy"),
    ).toBe("require-corp");
  } finally {
    if (previous === undefined) delete process.env.PUBLIC_ORIGIN;
    else process.env.PUBLIC_ORIGIN = previous;
    if (backend === undefined) delete process.env.OKNEF_BACKEND_URL;
    else process.env.OKNEF_BACKEND_URL = backend;
  }
});
