import { useSecurityMessages } from "@/features/security/messages";
import type { User } from "@/lib/api";
import type { Approval } from "./contracts";
export function DecisionCanvas({
  request,
  members,
}: {
  request: Approval;
  members: User[];
}) {
  const m = useSecurityMessages();
  const height = Math.max(240, request.reviewer_ids.length * 88 + 40);
  const center = height / 2;
  return (
    <div className="mt-5 overflow-auto rounded-2xl border border-border bg-background p-3">
      <svg
        viewBox={`0 0 820 ${height}`}
        role="img"
        aria-label={m.decisionMap}
        className="h-auto min-w-[36rem] w-full"
      >
        <title>{m.decisionMap}</title>
        {request.reviewer_ids.map((id, index) => {
          const y = 30 + index * 88;
          const member = members.find((item) => item.id === id);
          const vote = request.votes.find((item) => item.reviewer_id === id);
          return (
            <g key={id}>
              <path
                d={`M200 ${center} C250 ${center} 245 ${y + 30} 300 ${y + 30} M520 ${y + 30} C565 ${y + 30} 565 ${center} 610 ${center}`}
                fill="none"
                className="stroke-border"
                strokeWidth="2"
              />
              <rect
                x="300"
                y={y}
                width="220"
                height="60"
                rx="14"
                className={
                  vote?.decision === "reject"
                    ? "fill-danger-soft stroke-danger"
                    : vote
                      ? "fill-muted stroke-good"
                      : "fill-surface stroke-border"
                }
              />
              <text
                x="410"
                y={y + 25}
                textAnchor="middle"
                className="fill-foreground text-xs font-semibold"
              >
                {(member?.name || id).slice(0, 28)}
              </text>
              <text
                x="410"
                y={y + 45}
                textAnchor="middle"
                className="fill-secondary text-xs"
              >
                {vote ? m[vote.decision] : m.pending}
              </text>
            </g>
          );
        })}
        <rect
          x="10"
          y={center - 40}
          width="190"
          height="80"
          rx="18"
          className="fill-rail"
        />
        <text
          x="105"
          y={center - 8}
          textAnchor="middle"
          className="fill-accent text-xs font-semibold"
        >
          {m.requester}
        </text>
        <text
          x="105"
          y={center + 18}
          textAnchor="middle"
          className="fill-white text-xs"
        >
          {request.title.slice(0, 26)}
        </text>
        <rect
          x="610"
          y={center - 45}
          width="195"
          height="90"
          rx="18"
          className="fill-muted stroke-border"
        />
        <text
          x="707"
          y={center - 15}
          textAnchor="middle"
          className="fill-foreground text-xs font-semibold"
        >
          {m[request.status]}
        </text>
        <text
          x="707"
          y={center + 10}
          textAnchor="middle"
          className="fill-secondary text-xs"
        >
          {request.votes.filter((vote) => vote.decision === "approve").length} /{" "}
          {request.required_approvals} · {m.quorum}
        </text>
        <text
          x="707"
          y={center + 30}
          textAnchor="middle"
          className="fill-secondary text-xs"
        >
          {m.noExecution}
        </text>
      </svg>
    </div>
  );
}
