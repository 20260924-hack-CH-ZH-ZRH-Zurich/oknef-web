import { type NextRequest, NextResponse } from "next/server";
import { serverConfig } from "@/lib/config";
import { localizedPath } from "@/lib/locales";
export function proxy(request: NextRequest) {
  const { publicOrigin } = serverConfig();
  const canonical = new URL(publicOrigin);
  const path = request.nextUrl.pathname;
  if (
    ["GET", "HEAD"].includes(request.method) &&
    path !== "/api" &&
    !path.startsWith("/api/") &&
    !path.startsWith("/_next/") &&
    !/\.[a-z0-9]+$/i.test(path) &&
    request.headers.get("host") !== canonical.host
  ) {
    canonical.pathname = path;
    canonical.search = request.nextUrl.search;
    return NextResponse.redirect(canonical, 308);
  }
  const resolvedPath = localizedPath(path)?.pathname ?? path;
  const deck = resolvedPath.startsWith("/deck/");
  const workspace = resolvedPath === "/workspace";
  const nonce = Buffer.from(
    crypto.getRandomValues(new Uint8Array(18)),
  ).toString("base64");
  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "media-src 'self' blob:",
    "worker-src 'self'",
    deck ? "frame-src https://player.vimeo.com" : "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "report-uri /api/csp-report",
    "report-to csp-endpoint",
  ].join("; ");
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", policy);
  const localized = localizedPath(path);
  // Locale comes only from the validated path, never a client-supplied header.
  if (!path.startsWith("/api/")) headers.delete("x-oknef-locale");
  if (localized) headers.set("x-oknef-locale", localized.locale);
  const destination = request.nextUrl.clone();
  if (localized) destination.pathname = localized.pathname;
  const response = localized
    ? NextResponse.rewrite(destination, { request: { headers } })
    : NextResponse.next({ request: { headers } });
  const securityHeaders: Record<string, string> = {
    "Content-Security-Policy": policy,
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": deck ? "credentialless" : "require-corp",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "Reporting-Endpoints": 'csp-endpoint="/api/csp-report"',
    "Cache-Control": "no-store",
  };
  // Camera enables explicitly started QR/document capture; microphone enables opted-in voice and transcription.
  securityHeaders["Permissions-Policy"] =
    `camera=${workspace ? "(self)" : "()"}, microphone=(self), geolocation=(), payment=(), usb=(), browsing-topics=()`;
  for (const [name, value] of Object.entries(securityHeaders))
    response.headers.set(name, value);
  return response;
}
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.json|sw.js|offline.html|api/ws).*)",
  ],
};
