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

// Run before origin authorization or ticket consumption. Invalid transport
// input and synchronous request-construction errors must only close this socket.
// The handler returns its pending upstream request so an early client departure
// also cancels the handshake, before an upstream socket has been accepted.
export function websocketUpgrade(handler) {
  return (request, socket, head) => {
    if (!validHandshake(request)) {
      socket.destroy();
      return;
    }
    try {
      const forward = handler(request, socket, head);
      if (forward) {
        const cancel = () => forward.destroy();
        socket.once("close", cancel);
        socket.once("error", cancel);
        socket.once("end", () => {
          cancel();
          socket.destroy();
        });
        if (socket.destroyed) cancel();
      }
    } catch {
      socket.destroy();
    }
  };
}
