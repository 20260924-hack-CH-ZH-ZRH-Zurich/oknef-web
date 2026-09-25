import { expect, test } from "bun:test";
import {
  createServer,
  request as httpRequest,
  type IncomingMessage,
} from "node:http";
import { type AddressInfo, connect } from "node:net";
import { websocketUpgrade } from "./websocketUpgrade.mjs";

function handshake(extra: Record<string, unknown> = {}) {
  return {
    method: "GET",
    httpVersion: "1.1",
    headers: {
      origin: "https://workspace.example",
      upgrade: "websocket",
      connection: "keep-alive, Upgrade",
      "sec-websocket-key": Buffer.alloc(16, 1).toString("base64"),
      "sec-websocket-version": "13",
      ...extra,
    },
  };
}

test("malformed upgrades are rejected before authorization or ticket consumption", () => {
  let authorized = 0;
  let rejected = 0;
  const guard = websocketUpgrade(() => {
    authorized++;
  });
  const socket = { destroy: () => rejected++ };
  const invalid = [
    { "sec-websocket-key": undefined },
    { "sec-websocket-key": "not-a-key" },
    { "sec-websocket-key": `${"A".repeat(21)}B==` },
    { "sec-websocket-key": [Buffer.alloc(16).toString("base64")] },
    { "sec-websocket-version": "12" },
    { upgrade: "h2c" },
    { connection: "keep-alive" },
    { connection: "a".repeat(257) },
    { origin: undefined },
    { origin: "a".repeat(2049) },
    { cookie: "a".repeat(8193) },
    { "sec-websocket-protocol": "a".repeat(257) },
    { "transfer-encoding": "chunked" },
    { "content-length": "1" },
  ];
  for (const headers of invalid)
    guard(handshake(headers), socket, Buffer.alloc(0));
  guard({ ...handshake(), method: "POST" }, socket, Buffer.alloc(0));
  guard({ ...handshake(), httpVersion: "1.0" }, socket, Buffer.alloc(0));
  expect(authorized).toBe(0);
  expect(rejected).toBe(invalid.length + 2);
  guard(handshake({ cookie: "session=test" }), socket, Buffer.alloc(0));
  guard(
    handshake({
      origin: `chrome-extension://${"a".repeat(32)}`,
      "sec-websocket-protocol": `oknef.v1, oknef-ticket.${"a".repeat(43)}`,
    }),
    socket,
    Buffer.alloc(0),
  );
  expect(authorized).toBe(2);
});

test("closing the client during authentication cancels the pending upstream handshake", async () => {
  const upstream = createServer();
  let sawUpgrade: (() => void) | undefined;
  let sawClose: (() => void) | undefined;
  const upgrade = new Promise<void>((resolve) => {
    sawUpgrade = resolve;
  });
  const closed = new Promise<void>((resolve) => {
    sawClose = resolve;
  });
  upstream.on("upgrade", (_request, socket) => {
    socket.once("close", () => sawClose?.());
    socket.once("end", () => {
      sawClose?.();
      socket.destroy();
    });
    socket.resume();
    sawUpgrade?.();
    // Hold the handshake open to reproduce a client leaving during auth.
  });
  await new Promise<void>((resolve) =>
    upstream.listen(0, "127.0.0.1", resolve),
  );
  const upstreamPort = (upstream.address() as AddressInfo).port;
  const gateway = createServer();
  gateway.on(
    "upgrade",
    websocketUpgrade(
      (request: IncomingMessage, socket: import("node:net").Socket) => {
        const forward = httpRequest(`http://127.0.0.1:${upstreamPort}/api/ws`, {
          headers: request.headers,
        });
        forward.on("error", () => socket.destroy());
        forward.end();
        return forward;
      },
    ),
  );
  await new Promise<void>((resolve) => gateway.listen(0, "127.0.0.1", resolve));
  const client = connect((gateway.address() as AddressInfo).port, "127.0.0.1");
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    await new Promise<void>((resolve, reject) => {
      client.once("connect", resolve);
      client.once("error", reject);
    });
    client.write(
      `GET /api/ws HTTP/1.1\r\nHost: workspace.example\r\nOrigin: https://workspace.example\r\nConnection: Upgrade\r\nUpgrade: websocket\r\nSec-WebSocket-Version: 13\r\nSec-WebSocket-Key: ${Buffer.alloc(16, 1).toString("base64")}\r\n\r\n`,
    );
    await upgrade;
    client.destroy();
    await Promise.race([
      closed,
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(
          () => reject(new Error("upstream handshake leaked")),
          2000,
        );
      }),
    ]);
  } finally {
    clearTimeout(timeout);
    client.destroy();
    await Promise.all(
      [gateway, upstream].map(
        (server) =>
          new Promise<void>((resolve) => server.close(() => resolve())),
      ),
    );
  }
});

async function rawUpgrade(port: number, includeKey: boolean) {
  await new Promise<void>((resolve, reject) => {
    const socket = connect(port, "127.0.0.1");
    socket.setTimeout(2000, () =>
      socket.destroy(new Error("upgrade did not close")),
    );
    socket.on("error", reject);
    socket.on("close", () => resolve());
    socket.on("connect", () => {
      const key = includeKey
        ? `Sec-WebSocket-Key: ${Buffer.alloc(16, 1).toString("base64")}\r\n`
        : "";
      socket.write(
        `GET /api/ws HTTP/1.1\r\nHost: workspace.example\r\nOrigin: https://workspace.example\r\nConnection: Upgrade\r\nUpgrade: websocket\r\nSec-WebSocket-Version: 13\r\nCookie: bogus=test\r\n${key}\r\n`,
      );
    });
  });
}

test("raw malformed upgrades and constructor failures leave the HTTP gateway alive", async () => {
  const server = createServer((_request, response) => response.end("healthy"));
  let authorized = 0;
  server.on(
    "upgrade",
    websocketUpgrade((_request: IncomingMessage) => {
      authorized++;
      // Exercise the actual HTTP runtime's synchronous header-validation error.
      httpRequest("http://workspace.example", {
        headers: { "sec-websocket-key": undefined },
      });
    }),
  );
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as AddressInfo).port;
  try {
    await rawUpgrade(port, false);
    expect(authorized).toBe(0);
    await rawUpgrade(port, true);
    expect(authorized).toBe(1);
    expect(await (await fetch(`http://127.0.0.1:${port}`)).text()).toBe(
      "healthy",
    );
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
