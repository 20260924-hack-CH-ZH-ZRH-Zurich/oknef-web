import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { TrendChart } from "./TrendChart";

test("chart renders supplied counts and an accessible data table without adding detections", () => {
  const html = renderToStaticMarkup(
    <TrendChart
      points={[
        { day_start: 100000, checks: 2, flagged: 1 },
        { day_start: 186400, checks: 3, flagged: 0 },
      ]}
      title="Trend"
      locale="en"
      labels={{
        checks: "Checks",
        flagged: "Flagged",
        date: "Date",
        showData: "Data",
      }}
    />,
  );
  expect(html).toContain('aria-label="Trend"');
  expect(html).toContain("<td>3</td><td>0</td>");
  expect(html).not.toContain("NaN");
});
