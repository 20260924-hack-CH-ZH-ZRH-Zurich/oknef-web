import { expect, test } from "bun:test";
import { localizedPath } from "./locales";

test("locale roots and nested routes resolve without accepting partial locale names", () => {
  for (const locale of ["en", "es", "de", "fr"] as const) {
    expect(localizedPath(`/${locale}/`)).toEqual({ locale, pathname: "/" });
    expect(localizedPath(`/${locale}`)).toEqual({ locale, pathname: "/" });
    expect(localizedPath(`/${locale}/workspace`)).toEqual({
      locale,
      pathname: "/workspace",
    });
  }
  for (const path of ["/english", "/denial", "/api/en", "/it/"])
    expect(localizedPath(path)).toBeNull();
});
