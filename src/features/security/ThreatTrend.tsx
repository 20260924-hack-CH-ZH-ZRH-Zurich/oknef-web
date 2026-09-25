import { TrendChart } from "@/components/ui/data-display/TrendChart/TrendChart";
import { usePreferences } from "@/features/preferences/Preferences";
import type { SecurityOverview } from "./contracts";
import { useSecurityMessages } from "./messages";
export function ThreatTrend({ data }: { data: SecurityOverview }) {
  const m = useSecurityMessages();
  const { locale } = usePreferences();
  return (
    <section className="panel mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{m.trend}</h2>
        <span className="tag">
          {data.trends.reduce((sum, point) => sum + point.checks, 0)} {m.checks}
        </span>
      </div>
      <p className="subtext mt-3 max-w-3xl">{m.trendHelp}</p>
      <div className="mt-5">
        <TrendChart
          points={data.trends}
          title={m.trend}
          labels={m}
          locale={locale}
        />
      </div>
      {data.trends.every((point) => point.checks === 0) && (
        <p className="mt-4 text-xs text-secondary">{m.noHistory}</p>
      )}
    </section>
  );
}
