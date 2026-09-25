import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Toast } from "./Toast";

test("toast exposes a status and escapes evidence text", () => {
  const html = renderToStaticMarkup(
    <Toast
      title="Review"
      body="<script>untrusted</script>"
      actionLabel="Open"
      dismissLabel="Dismiss"
      onAction={() => {}}
      onDismiss={() => {}}
    />,
  );
  expect(html).toContain("<output");
  expect(html).toContain("&lt;script&gt;");
  expect(html).toContain('aria-label="Dismiss"');
});
