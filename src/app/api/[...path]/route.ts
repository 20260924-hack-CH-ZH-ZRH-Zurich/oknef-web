import type { NextRequest } from "next/server";
import { isPermittedEndpoint } from "@/lib/apiRoutes";
import { serverConfig } from "@/lib/config";
import { requestBodyLimit } from "@/lib/requestLimits";

async function readBody(request: NextRequest, limit: number) {
  const reader = request.body?.getReader();
  if (!reader) return undefined;
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new Error("BODY_LIMIT");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}
async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const endpoint = path.join("/");
  if (!isPermittedEndpoint(endpoint) || request.nextUrl.search)
    return Response.json({ error: "Unknown route" }, { status: 404 });
  try {
    const { backend, publicOrigin, extensionOrigin } = serverConfig();
    const requestedOrigin = request.headers.get("origin");
    const extension = !!extensionOrigin && requestedOrigin === extensionOrigin;
    if (
      (requestedOrigin && requestedOrigin !== publicOrigin && !extension) ||
      (!["GET", "HEAD"].includes(request.method) && !requestedOrigin)
    )
      return Response.json({ error: "Invalid origin" }, { status: 403 });
    const corsHeaders: Record<string, string> =
      extension && extensionOrigin
        ? {
            "Access-Control-Allow-Origin": extensionOrigin,
            "Access-Control-Allow-Credentials": "true",
            Vary: "Origin",
          }
        : {};
    if (request.method === "OPTIONS")
      return new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders,
          "Access-Control-Allow-Methods":
            "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-Oknef-Locale",
          "Cache-Control": "no-store",
        },
      });
    const headers = new Headers();
    for (const name of ["content-type", "cookie", "origin"]) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
    // The gateway has checked the exact installed extension origin. Backend
    // authorization still uses the user's HttpOnly session cookie.
    if (extension) headers.set("origin", publicOrigin);
    if (endpoint === "voice/call" || endpoint === "voice/session") {
      const locale = request.headers.get("x-oknef-locale") ?? "en";
      if (!["en", "de", "es", "fr"].includes(locale))
        return Response.json(
          { error: "Invalid voice locale" },
          { status: 400 },
        );
      headers.set("x-oknef-locale", locale);
    }
    const body = await readBody(request, requestBodyLimit(endpoint));
    const upstream = await fetch(`${backend}/api/${endpoint}`, {
      method: request.method,
      headers,
      body,
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(150_000),
    });
    const responseHeaders = new Headers({
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...corsHeaders,
    });
    for (const name of ["content-type", "set-cookie", "retry-after"]) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error && error.message === "BODY_LIMIT"
            ? "Request too large"
            : "Service unavailable",
      },
      {
        status:
          error instanceof Error && error.message === "BODY_LIMIT" ? 413 : 503,
      },
    );
  }
}
export {
  proxy as GET,
  proxy as POST,
  proxy as PUT,
  proxy as PATCH,
  proxy as DELETE,
  proxy as OPTIONS,
};
