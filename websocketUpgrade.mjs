function header(headers, name, maximum) {
  const value = headers[name];
  return typeof value === "string" && value.length <= maximum ? value : null;
}

function validHandshake(request) {
  const headers = request.headers;
  const key = header(headers, "sec-websocket-key", 24);
  const connection = header(headers, "connection", 256);
  return (
    request.method === "GET" &&
    request.httpVersion === "1.1" &&
    header(headers, "upgrade", 16)?.toLowerCase() === "websocket" &&
    connection
      ?.split(",")
      .some((token) => token.trim().toLowerCase() === "upgrade") &&
    header(headers, "sec-websocket-version", 2) === "13" &&
    !!key &&
    /^[A-Za-z0-9+/]{22}==$/.test(key) &&
    Buffer.from(key, "base64").toString("base64") === key &&
    !!header(headers, "origin", 2048) &&
    (!headers.cookie || !!header(headers, "cookie", 8192)) &&
    (!headers["sec-websocket-protocol"] ||
      !!header(headers, "sec-websocket-protocol", 256)) &&
    !headers["transfer-encoding"] &&
    (!headers["content-length"] || headers["content-length"] === "0")
  );
}

function diagnostics(onEvent) {
  return (stage, value) => {
    const event = { stage };
    if (typeof value?.code === "string" && /^[A-Z0-9_]{1,40}$/.test(value.code))
      event.code = value.code;
    if (Number.isInteger(value?.statusCode)) event.status = value.statusCode;
    onEvent(event);
  };
}

function watchHandshake(socket, forward, timeoutMs, report) {
  let pending = true;
  const finish = () => {
    pending = false;
    clearTimeout(deadline);
  };
  const cancel = (stage, value) => {
    if (pending) report(stage, value);
    finish();
    forward.destroy();
    socket.destroy();
  };
  const deadline = setTimeout(() => cancel("handshake_timeout"), timeoutMs);
  deadline.unref?.();
  forward.once("upgrade", (response) => {
    report("upstream_upgrade", response);
    finish();
  });
  forward.once("response", (response) => cancel("upstream_response", response));
  forward.once("error", (error) => cancel("upstream_error", error));
  forward.once("close", () => {
    if (pending) cancel("upstream_closed");
  });
  socket.once("close", () => cancel("client_closed"));
  socket.once("error", (error) => cancel("client_error", error));
  socket.once("end", () => cancel("client_ended"));
  if (socket.destroyed) cancel("client_closed");
}

// Run before origin authorization or ticket consumption. Invalid transport
// input and synchronous request-construction errors must only close this socket.
// The handler returns its pending upstream request so an early client departure
// also cancels the handshake, before an upstream socket has been accepted.
export function websocketUpgrade(
  handler,
  {
    handshakeTimeoutMs = 15000,
    onEvent = (event) => console.warn(JSON.stringify(event)),
  } = {},
) {
  const report = diagnostics(onEvent);
  return (request, socket, head) => {
    if (!validHandshake(request)) {
      report("invalid_handshake");
      socket.destroy();
      return;
    }
    report("received");
    try {
      const forward = handler(request, socket, head);
      if (forward) {
        report("upstream_requested");
        watchHandshake(socket, forward, handshakeTimeoutMs, report);
      }
    } catch (error) {
      report("setup_error", error);
      socket.destroy();
    }
  };
}
