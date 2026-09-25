import { GeneratedCards } from "@/components/ui/data-display/GeneratedCards/GeneratedCards";
import { usePreferences } from "@/features/preferences/Preferences";
import { type DocumentReply, documentText } from "./documents";
export function DocumentResult({ result }: { result: DocumentReply }) {
  const { locale } = usePreferences();
  const text = documentText[locale];
  return (
    <div>
      <p className="whitespace-pre-wrap text-sm leading-7">{result.summary}</p>
      <GeneratedCards
        cards={[
          {
            type: "checklist",
            title: text.field,
            body: "",
            items: result.fields.map(
              (field) =>
                `${field.name}: ${field.value} · ${text.confidence}: ${text[field.confidence]}`,
            ),
            severity: "info",
          },
          {
            type: "warning",
            title: text.title,
            body: text.notice,
            items: result.warnings,
            severity: "warning",
          },
        ]}
      />
      <p className="mt-3 text-xs text-secondary">
        {result.model} · {result.source}
      </p>
    </div>
  );
}
