import { randomBytes } from "node:crypto";

// Tickets authorize one websocket upgrade on this gateway, never an API request.
// The upstream checks the original session again, including logout/revocation.
export function extensionSocketGateway(config, options = {}) {
  const tickets = new Map();
  const now = options.now || Date.now;
  const authenticate =
    options.authenticate ||
    (async (cookie) => {
      const response = await fetch(new URL("/api/auth/me", config.backend), {
        headers: { cookie, origin: config.publicOrigin },
        redirect: "error",
        signal: AbortSignal.timeout(10000),
      });
      await response.body?.cancel();
      return response.ok;
    });
  const prune = () => {
    for (const [ticket, item] of tickets) {
      if (item.expires <= now()) tickets.delete(ticket);
    }
  };
  return {
    async handle(request, response) {
      if (request.url !== "/api/extension/socket-ticket") return false;
      response.setHeader("Cache-Control", "no-store");
      response.setHeader("Vary", "Origin");
      response.setHeader("X-Content-Type-Options", "nosniff");
      if (
        !config.extensionOrigin ||
        request.headers.origin !== config.extensionOrigin
      ) {
        response.writeHead(403).end();
        return true;
      }
      response.setHeader("Access-Control-Allow-Origin", config.extensionOrigin);
      response.setHeader("Access-Control-Allow-Credentials", "true");
      if (request.method === "OPTIONS") {
        response.setHeader("Access-Control-Allow-Methods", "POST");
        response.writeHead(204).end();
        return true;
      }
      if (request.method !== "POST") {
        response.writeHead(405, { Allow: "POST, OPTIONS" }).end();
        return true;
      }
      const cookie = request.headers.cookie || "";
      if (
        !cookie ||
        cookie.length > 8192 ||
        request.headers["transfer-encoding"] ||
        Number(request.headers["content-length"] || 0) !== 0
      ) {
        response.writeHead(400).end();
        return true;
      }
      prune();
      if (tickets.size >= 1024) {
        response.writeHead(429).end();
        return true;
      }
      try {
        if (!(await authenticate(cookie))) {
          response.writeHead(401).end();
          return true;
        }
        prune();
        if (tickets.size >= 1024) {
          response.writeHead(429).end();
          return true;
        }
        const ticket = randomBytes(32).toString("base64url");
        tickets.set(ticket, { cookie, expires: now() + 20000 });
        const expiry = setTimeout(() => tickets.delete(ticket), 20000);
        expiry.unref?.();
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ ticket }));
      } catch {
        response.writeHead(502).end();
      }
      return true;
    },
    consume(origin, protocols) {
      prune();
      if (
        !config.extensionOrigin ||
        origin !== config.extensionOrigin ||
        typeof protocols !== "string"
      )
        return null;
      const values = protocols.split(",").map((value) => value.trim());
      if (
        values.length !== 2 ||
        values[0] !== "oknef.v1" ||
        !/^oknef-ticket\.[A-Za-z0-9_-]{43}$/.test(values[1])
      )
        return null;
      const ticket = values[1].slice("oknef-ticket.".length);
      const item = tickets.get(ticket);
      tickets.delete(ticket);
      return item?.cookie || null;
    },
  };
}
