import { useState } from "react";
import type { Dashboard } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { SecurityOverview } from "./contracts";
import { useSecurityMessages } from "./messages";
export function AssetTopology({
  dashboard,
  security,
}: {
  dashboard: Dashboard;
  security: SecurityOverview;
}) {
  const m = useSecurityMessages();
  const [selected, setSelected] = useState("");
  const groups = [
    {
      title: m.assets,
      records: dashboard.assets.map((asset) => ({
        id: `asset-${asset.id}`,
        name: asset.name,
        detail: asset.institution || asset.category,
      })),
    },
    {
      title: m.members,
      records: dashboard.members.map((member) => ({
        id: `member-${member.id}`,
        name: member.name,
        detail: member.email,
      })),
    },
    {
      title: m.plans,
      records: dashboard.plans.map((plan) => ({
        id: `plan-${plan.id}`,
        name: plan.title,
        detail: `${plan.required_approvals} / ${plan.guardian_emails.length}`,
      })),
    },
    {
      title: m.sessions,
      records: security.sessions.map((session) => ({
        id: `session-${session.id}`,
        name: session.title,
        detail: m[session.kind],
      })),
    },
  ];
  const count = groups.reduce((sum, group) => sum + group.records.length, 0);
  return (
    <>
      <h2 className="text-2xl font-semibold">{m.topology}</h2>
      <p className="subtext mt-4 max-w-3xl">{m.topologyHelp}</p>
      <div className="panel mt-6 overflow-auto">
        <svg
          viewBox="0 0 920 340"
          role="img"
          aria-label={`${m.topology}: ${count} ${m.nodeCount}`}
          className="h-auto min-w-[36rem] w-full"
        >
          <title>{m.topology}</title>
          {groups.map((group, index) => {
            const x = 115 + index * 230;
            return (
              <g key={group.title}>
                <path
                  d={`M460,100 C460,170 ${x},125 ${x},205`}
                  fill="none"
                  className="stroke-border"
                  strokeWidth="2"
                />
                <rect
                  x={x - 95}
                  y="205"
                  width="190"
                  height="90"
                  rx="20"
                  className="fill-muted stroke-border"
                />
                <text
                  x={x}
                  y="237"
                  textAnchor="middle"
                  className="fill-secondary text-xs"
                >
                  {group.title}
                </text>
                <text
                  x={x}
                  y="273"
                  textAnchor="middle"
                  className="fill-foreground text-2xl font-semibold"
                >
                  {group.records.length}
                </text>
              </g>
            );
          })}
          <rect
            x="340"
            y="20"
            width="240"
            height="85"
            rx="24"
            className="fill-rail"
          />
          <text
            x="460"
            y="56"
            textAnchor="middle"
            className="fill-accent text-sm font-semibold"
          >
            {m.workspace}
          </text>
          <text
            x="460"
            y="82"
            textAnchor="middle"
            className="fill-white text-xs"
          >
            {count} {m.nodeCount}
          </text>
        </svg>
      </div>
      <div className="mt-6 grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
        {groups.map((group) => (
          <section
            key={group.title}
            className="rounded-2xl border border-border bg-surface p-5"
          >
            <h3 className="mb-4 text-sm font-semibold">{group.title}</h3>
            <ul className="max-h-96 space-y-2 overflow-auto">
              {group.records.map((record) => (
                <li key={record.id}>
                  <button
                    type="button"
                    aria-expanded={selected === record.id}
                    onClick={() =>
                      setSelected(selected === record.id ? "" : record.id)
                    }
                    className={cn(
                      "w-full rounded-xl border px-3 py-3 text-left text-xs",
                      selected === record.id
                        ? "border-good bg-muted"
                        : "border-border",
                    )}
                  >
                    <span className="break-words font-medium">
                      {record.name}
                    </span>
                    {selected === record.id && (
                      <span className="mt-2 block break-words leading-5 text-secondary">
                        {record.detail}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
            {!group.records.length && (
              <p className="text-xs text-secondary">0</p>
            )}
          </section>
        ))}
      </div>
      {count === 0 && <p className="subtext mt-5">{m.emptyGraph}</p>}
    </>
  );
}
