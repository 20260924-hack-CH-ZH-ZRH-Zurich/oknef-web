export function serverConfig() {
  const backend = process.env.OKNEF_BACKEND_URL;
  const publicOrigin = process.env.PUBLIC_ORIGIN;
  const extensionOrigin = process.env.OKNEF_EXTENSION_ORIGIN || undefined;
  if (
    extensionOrigin &&
    !/^chrome-extension:\/\/[a-p]{32}$/.test(extensionOrigin)
  )
    throw new Error("Invalid OKNEF_EXTENSION_ORIGIN");
  if (!backend) throw new Error("OKNEF_BACKEND_URL is required");
  if (!publicOrigin) throw new Error("PUBLIC_ORIGIN is required");
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
    throw new Error("Invalid OKNEF_BACKEND_URL");
  return { backend: url.origin, publicOrigin: origin.origin, extensionOrigin };
}
