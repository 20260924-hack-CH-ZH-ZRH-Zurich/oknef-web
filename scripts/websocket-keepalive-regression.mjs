import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { Agent, createServer, request } from "node:http";
import { fileURLToPath } from "node:url";

const cwd = fileURLToPath(new URL("..", import.meta.url));
assert(process.versions.bun, "Run this transport regression with Bun");
assert(
  existsSync(`${cwd}/.next/BUILD_ID`),
  "Build the web app before this regression",
);
const listen = (server) =>
  new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const close = (server) =>
  new Promise((resolve) => server.close(() => resolve()));
const reservation = createServer();
await listen(reservation);
const port = reservation.address().port;
await close(reservation);
const origin = `http://127.0.0.1:${port}`;
const fixture = createServer((_request, response) => response.end("{}"));
const fixtureSockets = new Set();
fixture.on("connection", (socket) => {
  fixtureSockets.add(socket);
  socket.once("close", () => fixtureSockets.delete(socket));
});
fixture.on("upgrade", (incoming, socket) => {
  const accept = createHash("sha1")
    .update(
      `${incoming.headers["sec-websocket-key"]}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`,
    )
    .digest("base64");
  socket.on("error", () => socket.destroy());
  socket.on("end", () => socket.destroy());
  socket.write(
    `HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`,
  );
  socket.resume();
});
await listen(fixture);
const runtime = spawn(process.execPath, ["server.mjs"], {
  cwd,
  env: {
    ...process.env,
    NODE_ENV: "production",
    HOSTNAME: "127.0.0.1",
    PORT: String(port),
    PUBLIC_ORIGIN: origin,
    OKNEF_BACKEND_URL: `http://127.0.0.1:${fixture.address().port}`,
    OKNEF_EXTENSION_ORIGIN: "",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
runtime.stderr.resume();
const agent = new Agent({ keepAlive: true, maxSockets: 1 });

function ready() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Web runtime startup timed out")),
      30000,
    );
    let output = "";
    runtime.stdout.on("data", (chunk) => {
      output = `${output}${chunk}`.slice(-4096);
      if (output.includes("Oknef web ready")) {
        clearTimeout(timeout);
        resolve();
      }
    });
    runtime.once("exit", () => {
      clearTimeout(timeout);
      reject(new Error("Web runtime exited"));
    });
    runtime.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

function ordinaryHttp(path) {
  return new Promise((resolve, reject) => {
    const outgoing = request(
      `${origin}${path}`,
      {
        agent,
        headers: { origin, cookie: "transport-fixture=session" },
        timeout: 3000,
      },
      (response) => {
        response.resume();
        response.on("end", () =>
          resolve({
            status: response.statusCode,
            connection: response.headers.connection,
          }),
        );
      },
    );
    outgoing.on("error", reject);
    outgoing.on("timeout", () =>
      outgoing.destroy(new Error("HTTP fixture request timed out")),
    );
    outgoing.end();
  });
}

function upgrade() {
  return new Promise((resolve, reject) => {
    const key = randomBytes(16).toString("base64");
    const outgoing = request(`${origin}/api/ws`, {
      agent,
      headers: {
        origin,
        cookie: "transport-fixture=session",
        connection: "Upgrade",
        upgrade: "websocket",
        "sec-websocket-version": "13",
        "sec-websocket-key": key,
      },
    });
    const timeout = setTimeout(
      () =>
        outgoing.destroy(
          new Error("WebSocket upgrade stalled after ordinary HTTP"),
        ),
      3000,
    );
    outgoing.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    outgoing.on("upgrade", (response, socket) => {
      clearTimeout(timeout);
      socket.destroy();
      resolve({
        status: response.statusCode,
        reused: outgoing.reusedSocket,
        accept:
          response.headers["sec-websocket-accept"] ===
          createHash("sha1")
            .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
            .digest("base64"),
      });
    });
    outgoing.on("response", (response) => {
      clearTimeout(timeout);
      response.resume();
      reject(new Error(`Unexpected upgrade status ${response.statusCode}`));
    });
    outgoing.end();
  });
}

try {
  await ready();
  for (const path of ["/api/health", "/en/login", "/api/auth/me"]) {
    const http = await ordinaryHttp(path);
    const websocket = await upgrade();
    assert.equal(
      http.connection,
      "close",
      "Ordinary Bun HTTP must prevent reuse for a later upgrade",
    );
    assert.equal(websocket.status, 101);
    assert.equal(websocket.accept, true);
    assert.equal(websocket.reused, false);
    console.log(
      JSON.stringify({
        path,
        httpStatus: http.status,
        connection: http.connection,
        upgradeStatus: websocket.status,
      }),
    );
  }
  console.log(
    "Bun + Next transport fixture: 3 HTTP-to-WebSocket sequences passed",
  );
} finally {
  agent.destroy();
  runtime.kill("SIGTERM");
  for (const socket of fixtureSockets) socket.destroy();
  fixture.closeAllConnections();
  await close(fixture);
}
