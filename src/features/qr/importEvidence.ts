import { z } from "zod";

const exportedQr = z
  .object({
    schema: z.literal("oknef.local-qr-evidence.v1"),
    captured_at: z.string().max(100),
    content: z.string().max(20000),
    evidence: z.unknown(),
    image_data_url: z
      .string()
      .max(6_000_000)
      .regex(/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/),
    assessment: z.unknown(),
  })
  .strict();
export async function qrImageFromExport(file: File) {
  if (file.size > 6_100_000) throw new Error("export too large");
  const exported = exportedQr.parse(JSON.parse(await file.text()));
  const raw = atob(exported.image_data_url.split(",")[1]);
  const bytes = Uint8Array.from(raw, (character) => character.charCodeAt(0));
  // Re-decode the pixels and derive our own fingerprint; exported verdicts are untrusted.
  return new File([bytes], "imported-qr-evidence.png", { type: "image/png" });
}
