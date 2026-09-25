import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/buttons/Button/Button";
import { WorkflowResult } from "@/features/chat/WorkflowResult";
import { workflowLabels } from "@/features/chat/workflowLabels";
import { usePreferences } from "@/features/preferences/Preferences";
import { api } from "@/lib/api";
import { useProductMessages } from "./messages";
import { type WorkflowRun, workflowRunSchema } from "./runContracts";
export function WorkflowHistory() {
  const m = useProductMessages();
  const { locale } = usePreferences();
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [selected, setSelected] = useState<WorkflowRun | null>(null);
  const [error, setError] = useState(false);
  const load = useCallback(() => {
    setError(false);
    void api(
      "/workflows/runs",
      z.object({ runs: z.array(workflowRunSchema) }).strict(),
    )
      .then((data) => setRuns(data.runs))
      .catch(() => setError(true));
  }, []);
  useEffect(load, [load]);
  if (selected)
    return (
      <section className="space-y-4">
        <Button variant="ghost" onClick={() => setSelected(null)}>
          {m.back}
        </Button>
        <h2 className="text-lg font-semibold">
          {workflowLabels[locale][selected.workflow]}
        </h2>
        {selected.status === "needs_human_review" ? (
          <WorkflowResult result={selected} />
        ) : (
          <div className="panel space-y-3">
            <span className="tag">
              {selected.status === "failed" ? m.runFailed : m.runPending}
            </span>
            <p className="subtext">{m.runBoundary}</p>
            {selected.status === "failed" && (
              <p className="text-sm text-danger">{selected.error_code}</p>
            )}
            <p className="break-all text-xs text-secondary">{selected.id}</p>
          </div>
        )}
      </section>
    );
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">{m.agentRuns}</h2>
        <Button variant="secondary" onClick={load}>
          {m.refresh}
        </Button>
      </div>
      <p className="subtext">{m.runBoundary}</p>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {m.error}
        </p>
      )}
      {runs.map((run) => (
        <button
          key={run.id}
          type="button"
          className="panel block w-full text-left"
          onClick={() => setSelected(run)}
        >
          <span className="tag">
            {run.status === "failed"
              ? m.runFailed
              : run.status === "pending"
                ? m.runPending
                : m.runComplete}
          </span>
          <h3 className="mt-3 font-semibold">
            {workflowLabels[locale][run.workflow]}
          </h3>
          {run.created_at && (
            <time
              className="subtext"
              dateTime={new Date(run.created_at).toISOString()}
            >
              {new Date(run.created_at).toLocaleString(locale)}
            </time>
          )}
        </button>
      ))}
      {!runs.length && <p className="subtext">{m.empty}</p>}
    </section>
  );
}
