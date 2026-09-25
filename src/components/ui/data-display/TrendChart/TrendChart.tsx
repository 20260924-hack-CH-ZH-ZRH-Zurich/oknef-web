import { scaleLinear, scaleUtc } from "d3-scale";
import { line } from "d3-shape";
export type TrendPoint = { day_start: number; checks: number; flagged: number };
export function TrendChart({
  points,
  title,
  labels,
  locale,
}: {
  points: TrendPoint[];
  title: string;
  labels: { checks: string; flagged: string; date: string; showData: string };
  locale: string;
}) {
  const ordered = [...points].sort((a, b) => a.day_start - b.day_start);
  if (!ordered.length) return null;
  const x = scaleUtc()
    .domain([
      ordered[0].day_start * 1000,
      ordered[ordered.length - 1].day_start * 1000,
    ])
    .range([44, 756]);
  const y = scaleLinear()
    .domain([0, Math.max(1, ...ordered.map((point) => point.checks))])
    .nice()
    .range([200, 20]);
  const shape = (field: "checks" | "flagged") =>
    line<TrendPoint>()
      .x((point) => x(point.day_start * 1000))
      .y((point) => y(point[field]))(ordered) || "";
  const date = (value: number) =>
    new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(new Date(value * 1000));
  return (
    <>
      <svg
        viewBox="0 0 800 250"
        className="h-auto w-full text-secondary"
        role="img"
        aria-label={title}
      >
        <title>{title}</title>
        {y
          .ticks(4)
          .filter(Number.isInteger)
          .map((tick) => (
            <g key={tick}>
              <line
                x1="44"
                x2="756"
                y1={y(tick)}
                y2={y(tick)}
                className="stroke-border"
              />
              <text
                x="32"
                y={y(tick) + 4}
                textAnchor="end"
                className="fill-secondary text-xs"
              >
                {tick}
              </text>
            </g>
          ))}
        <path
          d={shape("checks")}
          fill="none"
          className="stroke-good"
          strokeWidth="2.5"
        />
        <path
          d={shape("flagged")}
          fill="none"
          className="stroke-danger"
          strokeWidth="2.5"
          strokeDasharray="6 4"
        />
        {[
          ordered[0],
          ordered[Math.floor(ordered.length / 2)],
          ordered[ordered.length - 1],
        ].map((point, index) => (
          <text
            key={`${point.day_start}-${index}`}
            x={x(point.day_start * 1000)}
            y="230"
            textAnchor={index === 0 ? "start" : index === 2 ? "end" : "middle"}
            className="fill-secondary text-xs"
          >
            {date(point.day_start)}
          </text>
        ))}
      </svg>
      <div className="flex flex-wrap gap-5 text-xs">
        <span className="flex items-center gap-2">
          <span className="h-0.5 w-5 bg-good" />
          {labels.checks}
        </span>
        <span className="flex items-center gap-2">
          <span className="w-5 border-t-2 border-dashed border-danger" />
          {labels.flagged}
        </span>
      </div>
      <details className="mt-5 text-xs">
        <summary className="cursor-pointer text-secondary">
          {labels.showData}
        </summary>
        <div className="mt-4 max-h-60 overflow-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="py-2">{labels.date}</th>
                <th>{labels.checks}</th>
                <th>{labels.flagged}</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((point) => (
                <tr key={point.day_start} className="border-t border-border">
                  <td className="py-2">{date(point.day_start)}</td>
                  <td>{point.checks}</td>
                  <td>{point.flagged}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
