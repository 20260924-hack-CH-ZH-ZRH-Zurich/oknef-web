// Serialized request budgets include encoding or multipart overhead.
export function requestBodyLimit(endpoint: string) {
  if (endpoint === "drive") return 12 * 1024 * 1024;
  if (endpoint === "media/analyze") return 18_000_000 + 16_384;
  if (endpoint === "transcribe") return 12_000_000 + 64_000;
  if (endpoint === "ocr") return 6_000_000;
  return 100_000;
}
