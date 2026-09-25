import {
  AlertTriangle,
  CheckCircle2,
  ListChecks,
  Sparkles,
} from "lucide-react";
export type GenerativeCard = {
  type: string;
  title: string;
  body: string;
  items: string[];
  severity: string;
};
export function GeneratedCards({ cards }: { cards: GenerativeCard[] }) {
  return (
    <div className="my-4 grid gap-3 sm:grid-cols-2">
      {cards.map((card, index) => (
        <section
          key={`${card.title}-${index}`}
          className={`rounded-2xl border p-4 ${card.type === "warning" ? "border-danger/20 bg-danger-soft" : "border-border bg-background"}`}
        >
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            {card.type === "warning" ? (
              <AlertTriangle size={17} className="text-danger" />
            ) : card.type === "checklist" || card.type === "steps" ? (
              <ListChecks size={17} className="text-good" />
            ) : (
              <Sparkles size={17} className="text-good" />
            )}
            <h3>{card.title}</h3>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-6 text-secondary">
            {card.body}
          </p>
          {card.items.length > 0 && (
            <ol className="mt-3 space-y-2">
              {[...new Set(card.items)].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm leading-6"
                >
                  <CheckCircle2 size={14} className="mt-1 shrink-0 text-good" />
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      ))}
    </div>
  );
}
