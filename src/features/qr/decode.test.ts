import { expect, test } from "bun:test";
import { decodePixels } from "./decode";
import fixture from "./fixtures/qr.json";

test("decodes the actual pixels of a synthetic QR without fetching its URL", () => {
  const scale = 6;
  const margin = 4;
  const size = (fixture.rows.length + margin * 2) * scale;
  const pixels = new Uint8ClampedArray(size * size * 4).fill(255);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const row = Math.floor(y / scale) - margin;
      const col = Math.floor(x / scale) - margin;
      if (fixture.rows[row]?.[col] !== "1") continue;
      const offset = (y * size + x) * 4;
      pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = 0;
    }
  expect(decodePixels(pixels, size, size)).toBe(fixture.value);
  expect(() => decodePixels(new Uint8ClampedArray(400), 10, 10)).toThrow();
  expect(() => decodePixels(pixels, 9000, 9000)).toThrow();
});
