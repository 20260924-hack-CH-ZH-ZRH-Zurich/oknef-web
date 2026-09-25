import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useProductMessages } from "@/features/product/messages";
import { Chat } from "./Chat";
export function GlobalChat({
  open,
  onClose,
  contextView,
}: {
  open: boolean;
  onClose: () => void;
  contextView: string;
}) {
  const m = useProductMessages();
  const [visited, setVisited] = useState(false);
  useEffect(() => {
    if (open) setVisited(true);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open, onClose]);
  if (!visited && !open) return null;
  return (
    <aside
      hidden={!open}
      aria-label={m.assistant}
      className="fixed bottom-0 right-0 top-0 z-40 w-full overflow-y-auto border-l border-border bg-background p-5 shadow-2xl sm:w-[36rem]"
    >
      <header className="mb-3 flex items-center justify-between">
        <p className="text-xs text-secondary">
          {m.context}: {contextView}
        </p>
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label={m.close}
        >
          <X size={18} />
        </button>
      </header>
      <Chat contextView={contextView} active={open} />
    </aside>
  );
}
