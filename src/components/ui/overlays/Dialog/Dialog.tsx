"use client";
import { X } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef } from "react";
export function Dialog({
  open,
  onClose,
  title,
  closeLabel,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (open && !ref.current?.open) ref.current?.showModal();
    if (!open) ref.current?.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClose={onClose}
      className="m-auto max-h-[90dvh] w-[min(34rem,94vw)] rounded-3xl border border-border bg-surface p-7 text-foreground shadow-2xl backdrop:bg-rail/55"
      aria-labelledby={titleId}
    >
      <header className="mb-6 flex items-center justify-between gap-4">
        <h2 id={titleId} className="text-xl font-semibold">
          {title}
        </h2>
        <button
          type="button"
          className="icon-button shrink-0"
          title={closeLabel}
          aria-label={closeLabel}
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
