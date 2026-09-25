export function runtimeConfig() {
  const backend = process.env.OKNEF_BACKEND_URL;
  const publicOrigin = process.env.PUBLIC_ORIGIN;
  const port = Number(process.env.PORT);
  const hostname = process.env.HOSTNAME;
  if (
    !backend ||
    !publicOrigin ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    !hostname
  )
    throw new Error(
      "OKNEF_BACKEND_URL, PUBLIC_ORIGIN, PORT, and HOSTNAME are required",
    );
  const url = new URL(backend);
  const origin = new URL(publicOrigin);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    !["http:", "https:"].includes(origin.protocol) ||
    origin.username ||
    origin.password ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash
  )
    throw new Error("Invalid backend origin");
  return {
    backend: url,
    publicOrigin: origin.origin,
    port,
    hostname,
    dev: process.env.NODE_ENV !== "production",
  };
}
