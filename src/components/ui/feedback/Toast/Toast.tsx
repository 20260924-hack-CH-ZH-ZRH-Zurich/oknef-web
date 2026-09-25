import { ShieldAlert, X } from "lucide-react";
export function Toast({
  title,
  body,
  actionLabel,
  dismissLabel,
  onAction,
  onDismiss,
}: {
  title: string;
  body: string;
  actionLabel: string;
  dismissLabel: string;
  onAction: () => void;
  onDismiss: () => void;
}) {
  return (
    <output className="block rounded-2xl border border-border bg-surface p-5 shadow-lg">
      <div className="flex items-start gap-3">
        <ShieldAlert className="shrink-0 text-danger" size={21} />
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="mt-2 text-xs leading-5 text-secondary">{body}</p>
          <button
            type="button"
            onClick={onAction}
            className="mt-3 text-xs font-semibold text-good underline underline-offset-4"
          >
            {actionLabel}
          </button>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className="ml-auto text-secondary"
        >
          <X size={16} />
        </button>
      </div>
    </output>
  );
}
