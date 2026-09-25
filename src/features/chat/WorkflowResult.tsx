import { ShieldCheck, Users } from "lucide-react";
import { GeneratedCards } from "@/components/ui/data-display/GeneratedCards/GeneratedCards";
import { usePreferences } from "@/features/preferences/Preferences";
import { reviewScopeText } from "./workflowLabels";
import { type WorkflowReply, workflowText } from "./workflows";
export function WorkflowResult({ result }: { result: WorkflowReply }) {
  const { locale } = usePreferences();
  const words = workflowText[locale];
  return (
    <div className="space-y-4">
      <p className="flex items-center gap-2 text-sm font-medium">
        <Users size={16} />
        {words.mode}
      </p>
      <GeneratedCards
        cards={result.findings.map((item) => ({
          type: "summary",
          title: item.agent,
          body: item.answer,
          items: [`${words.source}: ${item.source}`],
          severity: "info",
        }))}
      />
      <GeneratedCards
        cards={[
          {
            type: "checklist",
            title: `${words.review} · ${result.review.agent}`,
            body: result.review.answer,
            items: [`${words.source}: ${result.review.source}`],
            severity: "warning",
          },
        ]}
      />
      <p className="flex items-start gap-2 rounded-xl bg-warning-soft p-3 text-xs leading-6 text-warning">
        <ShieldCheck className="mt-1 shrink-0" size={14} />
        {words.notice}
      </p>
      <p className="break-all text-[.65rem] text-secondary">
        {result.provider} · {result.id}
      </p>
      {result.review_scope.truncated && (
        <p className="rounded-xl bg-danger-soft p-3 text-xs leading-6 text-danger">
          {reviewScopeText[locale]}: {result.review_scope.reviewed_characters} /{" "}
          {result.review_scope.input_characters}.
        </p>
      )}
    </div>
  );
}
