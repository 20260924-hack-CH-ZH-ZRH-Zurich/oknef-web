import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { GeneratedCards } from "./GeneratedCards";

describe("generated content boundary", () => {
  test("escapes model HTML and does not turn text into executable actions", () => {
    const html = renderToStaticMarkup(
      <GeneratedCards
        cards={[
          {
            type: "warning",
            title: "<script>alert(1)</script>",
            body: '<img src=x onerror="alert(1)">',
            items: ["javascript:alert(1)", "Review with a human"],
            severity: "warning",
          },
        ]}
      />,
    );
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).not.toContain('href="javascript:');
    expect(html).toContain("Review with a human");
  });
});
