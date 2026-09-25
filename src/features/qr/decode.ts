import jsQR from "jsqr";

export function decodePixels(
  data: Uint8ClampedArray,
  width: number,
  height: number,
) {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1 ||
    width * height > 4_000_000 ||
    data.length !== width * height * 4
  )
    throw new Error("Invalid image dimensions");
  const decoded = jsQR(data, width, height, {
    inversionAttempts: "attemptBoth",
  });
  if (!decoded?.data || decoded.data.length > 8000)
    throw new Error("No supported QR content");
  return decoded.data;
}
export async function decodeQrImage(file: File) {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 4 * 1024 * 1024
  )
    throw new Error("Unsupported image");
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 16_000_000)
      throw new Error("Image too large");
    const ratio = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Image reading unavailable");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    return decodePixels(image.data, image.width, image.height);
  } finally {
    bitmap.close();
  }
}
