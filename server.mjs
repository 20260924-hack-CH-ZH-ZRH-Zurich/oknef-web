import { createServer, request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import next from "next";
import { extensionSocketGateway } from "./extension-socket.mjs";
import { runtimeConfig } from "./runtime-config.mjs";

const config = runtimeConfig();
const extensionSockets = extensionSocketGateway(config);
let handle;
const server = createServer(async (request, response) => {
  if (!(await extensionSockets.handle(request, response)))
    handle(request, response);
});
const app = next({
  dev: config.dev,
  hostname: config.hostname,
  port: config.port,
  // Next installs an upgrade listener lazily; keep it off our authenticated route.
  httpServer: {
    on(event, listener) {
      server.on(event, (...args) => {
        if (event !== "upgrade" || args[0].url !== "/api/ws") listener(...args);
      });
    },
  },
});
await app.prepare();
handle = app.getRequestHandler();
server.on("upgrade", (request, socket, head) => {
  const extension =
    !!config.extensionOrigin &&
    request.headers.origin === config.extensionOrigin;
  let origin;
  try {
    origin = new URL(request.headers.origin || "");
  } catch {
    socket.destroy();
    return;
  }
  if (
    request.url !== "/api/ws" ||
    (!extension &&
      (origin.origin !== config.publicOrigin ||
        !["http:", "https:"].includes(origin.protocol)))
  ) {
    socket.destroy();
    return;
  }
  const cookie = extension
    ? extensionSockets.consume(
        request.headers.origin,
        request.headers["sec-websocket-protocol"],
      )
    : request.headers.cookie;
  if (!cookie) {
    socket.destroy();
    return;
  }
  const url = new URL("/api/ws", config.backend);
  const forward = (url.protocol === "https:" ? httpsRequest : httpRequest)(
    url,
    {
      headers: {
        host: url.host,
        upgrade: "websocket",
        connection: "Upgrade",
        "sec-websocket-key": request.headers["sec-websocket-key"],
        "sec-websocket-version": "13",
        cookie,
        origin: config.publicOrigin,
      },
      timeout: 15000,
    },
  );
  forward.on("upgrade", (response, upstream, upstreamHead) => {
    if (
      response.statusCode !== 101 ||
      !response.headers["sec-websocket-accept"]
    ) {
      socket.destroy();
      upstream.destroy();
      return;
    }
    upstream.setTimeout(0);
    socket.write(
      `HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${response.headers["sec-websocket-accept"]}\r\n${extension ? "Sec-WebSocket-Protocol: oknef.v1\r\n" : ""}\r\n`,
    );
    if (head.length) upstream.write(head);
    if (upstreamHead.length) socket.write(upstreamHead);
    upstream.on("error", () => socket.destroy());
    socket.on("error", () => upstream.destroy());
    socket.on("close", () => upstream.destroy());
    upstream.on("close", () => socket.destroy());
    socket.pipe(upstream).pipe(socket);
  });
  forward.on("response", () => socket.destroy());
  forward.on("timeout", () => {
    forward.destroy();
    socket.destroy();
  });
  forward.on("error", () => socket.destroy());
  forward.end();
});
server.listen(config.port, config.hostname, () =>
  console.info("Oknef web ready"),
);
