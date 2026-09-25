import type { z } from "zod";
import type { Evidence } from "@/features/evidence/localStore";
import type { sessionInputSchema } from "@/features/security/contracts";

export function captureSubmission(
  input: z.infer<typeof sessionInputSchema>,
  file: File,
  evidence: Evidence,
  locale: string,
) {
  if (!file.size || file.size > 20 * 1024 * 1024)
    throw new Error("Invalid capture size");
  const form = new FormData();
  // The server derives its fingerprint from the bytes, never from client metadata.
  const safeName =
    truncateUtf8(file.name.replace(/[^\p{L}\p{N} ._()-]/gu, "_"), 160) ||
    "capture";
  const mime = file.type.split(";")[0];
  form.append(
    "file",
    new File([file], safeName, {
      type: mime === "audio/x-wav" ? "audio/wav" : mime,
    }),
  );
  form.append("kind", input.kind);
  form.append("title", input.title);
  form.append("content", input.content);
  form.append("source", evidence.source);
  form.append("locale", locale);
  if (evidence.captured_at !== undefined)
    form.append("captured_at", String(evidence.captured_at));
  if (input.reference_text) form.append("reference_text", input.reference_text);
  if (input.parent_session_id)
    form.append("parent_session_id", input.parent_session_id);
  if (input.asset_ids)
    form.append("asset_ids", JSON.stringify(input.asset_ids));
  return { method: "POST", body: form };
}

export function suggestedName(label: string, name?: string) {
  return truncateUtf8(
    `${label} · ${name?.replace(/\.[^.]+$/, "") || new Date().toLocaleDateString()}`,
    150,
  );
}

export function truncateUtf8(value: string, maximum: number) {
  let bytes = 0;
  let result = "";
  const encoder = new TextEncoder();
  for (const character of value) {
    bytes += encoder.encode(character).length;
    if (bytes > maximum) break;
    result += character;
  }
  return result;
}
