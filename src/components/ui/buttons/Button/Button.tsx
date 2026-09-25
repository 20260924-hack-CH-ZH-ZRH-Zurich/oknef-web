import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition active:scale-[.98]",
        variant === "primary" &&
          "bg-accent text-accent-ink hover:brightness-95",
        variant === "secondary" &&
          "border border-border bg-surface text-foreground hover:bg-muted",
        variant === "ghost" && "text-secondary hover:bg-muted",
        variant === "danger" && "bg-danger-soft text-danger",
        className,
      )}
      {...props}
    />
  );
}
