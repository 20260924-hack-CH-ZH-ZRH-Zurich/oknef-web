import { cn } from "@/lib/utils";
export function Brand({
  inverse = false,
  compact = false,
}: {
  inverse?: boolean;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 font-semibold tracking-tighter",
        inverse ? "text-white" : "text-foreground",
      )}
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M16 2 29 9.5v13L16 30 3 22.5v-13L16 2Z"
          className="fill-accent"
        />
        <path
          d="M10 10v12m0-6h5m0 0 6-6m-6 6 6 6"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-accent-ink"
        />
      </svg>
      {!compact && (
        <span className="text-2xl">
          oknef<span className="text-accent">.</span>
        </span>
      )}
    </span>
  );
}
