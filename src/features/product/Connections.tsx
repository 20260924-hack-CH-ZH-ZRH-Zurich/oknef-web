import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { api } from "@/lib/api";
import { type Graph, graphSchema } from "./contracts";
import { useProductMessages } from "./messages";
export function Connections({
  sessionsOnly = false,
}: {
  sessionsOnly?: boolean;
}) {
  const m = useProductMessages();
  const [data, setData] = useState<Graph | null>(null);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState("");
  const refresh = useCallback(async () => {
    try {
      setData(await api("/graph", graphSchema));
      setError(false);
    } catch {
      setError(true);
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const nodes = useMemo(
    () =>
      (data?.nodes ?? [])
        .filter(
          (node) =>
            (!sessionsOnly || node.kind.includes("session")) &&
            (!filter ||
              `${node.label} ${node.kind}`
                .toLowerCase()
                .includes(filter.toLowerCase())),
        )
        .slice(0, 64),
    [data, sessionsOnly, filter],
  );
  const position = useMemo(
    () =>
      new Map(
        nodes.map((node, index) => [
          node.id,
          { x: 110 + (index % 4) * 240, y: 75 + Math.floor(index / 4) * 140 },
        ]),
      ),
    [nodes],
  );
  const edges = (data?.edges ?? []).filter(
    (edge) => position.has(edge.source) && position.has(edge.target),
  );
  const item = data?.nodes.find((node) => node.id === selected);
  return (
    <section className="space-y-6">
      <header className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="page-title">
            {sessionsOnly ? m.sessionGraph : m.connections}
          </h1>
          <p className="subtext mt-3 max-w-3xl">{m.graphHelp}</p>
        </div>
        <Button variant="secondary" onClick={refresh}>
          {m.refresh}
        </Button>
      </header>
      <label className="block max-w-md">
        <span className="field-label">{m.filter}</span>
        <input
          className="field"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {m.error}
        </p>
      )}
      <div className="panel max-h-[36rem] overflow-auto">
        <svg
          viewBox={`0 0 960 ${Math.max(280, Math.ceil(nodes.length / 4) * 140)}`}
          className="min-w-[44rem] w-full"
          role="img"
          aria-label={m.topology}
        >
          <title>{m.topology}</title>
          {edges.map((edge) => {
            const from = position.get(edge.source);
            const to = position.get(edge.target);
            if (!from || !to) return null;
            return (
              <path
                key={`${edge.source}-${edge.target}-${edge.relation}`}
                d={`M ${from.x} ${from.y} C ${from.x} ${from.y + 70}, ${to.x} ${to.y - 70}, ${to.x} ${to.y}`}
                fill="none"
                className={
                  selected === edge.source || selected === edge.target
                    ? "stroke-good"
                    : "stroke-border"
                }
                strokeWidth={
                  selected === edge.source || selected === edge.target ? 3 : 1.5
                }
              />
            );
          })}
          {nodes.map((node) => {
            const p = position.get(node.id);
            if (!p) return null;
            return (
              <g key={node.id}>
                <rect
                  x={p.x - 100}
                  y={p.y - 35}
                  width={200}
                  height={75}
                  rx={18}
                  className={
                    selected === node.id
                      ? "fill-accent stroke-good"
                      : "fill-muted stroke-border"
                  }
                />
                <text
                  x={p.x}
                  y={p.y - 5}
                  textAnchor="middle"
                  className="fill-foreground text-xs font-semibold"
                >
                  {(node.label || node.id).slice(0, 24)}
                </text>
                <text
                  x={p.x}
                  y={p.y + 17}
                  textAnchor="middle"
                  className="fill-secondary text-[.6rem]"
                >
                  {node.kind}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="flex flex-wrap gap-2">
        {nodes.map((node) => (
          <button
            type="button"
            key={node.id}
            onClick={() => setSelected(node.id)}
            aria-pressed={selected === node.id}
            className={`rounded-full border px-3 py-2 text-xs ${selected === node.id ? "border-good bg-accent/20" : "border-border bg-surface"}`}
          >
            {node.label || node.id.slice(0, 8)}
          </button>
        ))}
      </div>
      {item && (
        <article className="panel">
          <h2 className="font-semibold">{item.label}</h2>
          <p className="mt-2 text-xs text-secondary">
            {item.kind} · {item.status || m.registered}
          </p>
          <ul className="mt-4 space-y-2 text-xs">
            {data?.edges
              .filter(
                (edge) => edge.source === selected || edge.target === selected,
              )
              .map((edge) => (
                <li key={`${edge.source}-${edge.target}-${edge.relation}`}>
                  {data.nodes.find((node) => node.id === edge.source)?.label} →{" "}
                  {edge.relation} →{" "}
                  {data.nodes.find((node) => node.id === edge.target)?.label}
                </li>
              ))}
          </ul>
        </article>
      )}
      {data && !nodes.length && <p className="subtext">{m.empty}</p>}
    </section>
  );
}
