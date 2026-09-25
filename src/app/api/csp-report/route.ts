export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > 16384)
    return new Response(null, { status: 413 });
  const reader = request.body?.getReader();
  let size = 0;
  if (reader)
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16384) {
        await reader.cancel();
        return new Response(null, { status: 413 });
      }
    }
  // Reports can contain URLs and document fragments; do not persist their raw contents.
  return new Response(null, { status: 204 });
}
