import { expect, test } from "bun:test";
import { extensionSocketGateway } from "./extension-socket.mjs";

const origin = `chrome-extension://${"a".repeat(32)}`;
function response() {
  return {
    status: 0,
    body: "",
    headers: new Map(),
    setHeader(k: string, v: string) {
      this.headers.set(k, v);
    },
    writeHead(n: number, headers = {}) {
      this.status = n;
      for (const [k, v] of Object.entries(headers)) this.headers.set(k, v);
      return this;
    },
    end(body = "") {
      this.body = body;
      return this;
    },
  };
}
test("socket tickets require an exact extension origin and active cookie", async () => {
  const gateway = extensionSocketGateway(
    { extensionOrigin: origin },
    { authenticate: async (cookie: string) => cookie === "session=valid" },
  );
  for (const [requestOrigin, cookie, status] of [
    [`${origin}.evil`, "session=valid", 403],
    ["null", "session=valid", 403],
    [origin, "session=invalid", 401],
    [origin, "", 400],
  ] as const) {
    const r = response();
    await gateway.handle(
      {
        url: "/api/extension/socket-ticket",
        method: "POST",
        headers: { origin: requestOrigin, cookie },
      },
      r,
    );
    expect(r.status).toBe(status);
  }
});
test("socket tickets are short lived, single use and scoped to their origin and protocol", async () => {
  let time = 0;
  const gateway = extensionSocketGateway(
    { extensionOrigin: origin },
    { now: () => time, authenticate: async () => true },
  );
  const issue = async () => {
    const r = response();
    await gateway.handle(
      {
        url: "/api/extension/socket-ticket",
        method: "POST",
        headers: { origin, cookie: "session=valid" },
      },
      r,
    );
    expect(r.status).toBe(200);
    expect(r.headers.get("Cache-Control")).toBe("no-store");
    return JSON.parse(r.body).ticket;
  };
  const ticket = await issue();
  const protocols = `oknef.v1, oknef-ticket.${ticket}`;
  expect(gateway.consume("https://example.com", protocols)).toBeNull();
  expect(gateway.consume(origin, `${protocols}, extra`)).toBeNull();
  expect(gateway.consume(origin, protocols)).toBe("session=valid");
  expect(gateway.consume(origin, protocols)).toBeNull();
  const expired = await issue();
  time = 20000;
  expect(
    gateway.consume(origin, `oknef.v1, oknef-ticket.${expired}`),
  ).toBeNull();
});
test("ticket route rejects bodies and non-POST requests; disabled gateway denies issuance", async () => {
  const gateway = extensionSocketGateway(
    { extensionOrigin: origin },
    { authenticate: async () => true },
  );
  for (const [method, extra, status] of [
    ["GET", {}, 405],
    ["POST", { "content-length": "1" }, 400],
    ["POST", { "transfer-encoding": "chunked" }, 400],
    ["OPTIONS", {}, 204],
  ] as const) {
    const r = response();
    await gateway.handle(
      {
        url: "/api/extension/socket-ticket",
        method,
        headers: { origin, cookie: "session=valid", ...extra },
      },
      r,
    );
    expect(r.status).toBe(status);
  }
  const r = response();
  await extensionSocketGateway({}).handle(
    { url: "/api/extension/socket-ticket", headers: { origin } },
    r,
  );
  expect(r.status).toBe(403);
});
