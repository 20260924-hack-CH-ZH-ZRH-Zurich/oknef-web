import assert from "node:assert/strict";
import { expect } from "@playwright/test";
export async function verifyProductNavigation(page, context, check, screen) {
  for (const [locale, title] of [
    ["de", "Mini-Apps"],
    ["es", "Mini aplicaciones"],
    ["fr", "Mini-apps"],
    ["en", "Mini apps"],
  ]) {
    await page.goto(`/${locale}/workspace?view=miniapps`);
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    assert.equal(await page.locator("html").getAttribute("lang"), locale);
  }
  check("EN ES DE FR routes render localized workspaces");
  for (const mode of ["company", "admin"]) {
    const issued = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/auth/demo") &&
        response.request().method() === "POST",
    );
    await page
      .getByRole("combobox", { name: "Change demo role" })
      .selectOption(mode);
    assert.equal((await issued).status(), 200);
    await page.waitForURL("**/workspace");
    await page.getByRole("combobox", { name: "Change demo role" }).waitFor();
    const me = await (await context.request.get("/api/auth/me")).json();
    assert.equal((me.user || me).demo_profile, mode);
  }
  check("Company and admin demo profiles are issued by server");
  await page.goto("/en/deck/JO202609240900");
  const dots = page.getByRole("button", { name: /^Slide / });
  const count = await dots.count();
  assert(count > 2);
  await dots.nth(count - 2).click();
  await expect(page.locator('iframe[src*="1230180083"]')).toHaveCount(1);
  await screen("deck-video");
  await dots.nth(count - 1).click();
  await expect(page.locator('iframe[src*="1230180083"]')).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Open the repositories" }),
  ).toHaveAttribute(
    "href",
    "https://github.com/orgs/20260924-hack-CH-ZH-ZRH-Zurich/repositories",
  );
  check("Vimeo mounts only on its slide and repository link is correct");
}
