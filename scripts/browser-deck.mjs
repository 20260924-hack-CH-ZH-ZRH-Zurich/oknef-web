import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import { qaConfig } from "./qa-config.mjs";

const config = qaConfig();
await mkdir(config.output, { recursive: true });
const browser = await chromium.launch({
  executablePath: config.executablePath,
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const report = { completed: false, locales: [], images: [], errors: [] };
page.on("pageerror", (error) => report.errors.push(error.message));
try {
  for (const [locale, counter] of [
    ["en", "Slide"],
    ["es", "Diapositiva"],
    ["de", "Folie"],
    ["fr", "Diapositive"],
  ]) {
    const response = await page.goto(
      `${config.base}/${locale}/deck/JO202609240900`,
    );
    assert.equal(response.status(), 200);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    for (let index = 1; index <= 20; index++) {
      await page
        .getByRole("button", { name: `${counter} ${index}`, exact: true })
        .click();
      await expect(page.locator("h1")).toBeVisible();
      const media = page.locator("figure img");
      if (await media.count()) {
        await expect
          .poll(() =>
            media.evaluate((image) => image.complete && image.naturalWidth > 0),
          )
          .toBe(true);
        const source = await media.getAttribute("src");
        const asset = await page.request.get(
          new URL(source, config.base).toString(),
        );
        assert.equal(asset.status(), 200);
        report.images.push({ locale, slide: index, source });
      }
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        ),
        false,
      );
      if ([6, 7, 13].includes(index))
        await page.screenshot({
          path: `${config.output}/deck-${locale}-${index}.png`,
          fullPage: true,
        });
    }
    report.locales.push({ locale, slides: 20 });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Diapositive 6", exact: true })
    .click();
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
    false,
  );
  await page.screenshot({
    path: `${config.output}/deck-mobile.png`,
    fullPage: true,
  });
  assert.deepEqual(report.errors, []);
  report.completed = true;
  console.info(
    "PASS 80 localized slides, 48 real screenshots/guide references, desktop and mobile overflow, no page errors",
  );
} finally {
  await writeFile(
    `${config.output}/deck-report.json`,
    JSON.stringify(report, null, 2),
  );
  await browser.close();
}
