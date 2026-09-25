export function GET() {
  return Response.json(
    { status: "ok", service: "oknef-web" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
