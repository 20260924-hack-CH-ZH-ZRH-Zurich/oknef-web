import { Microscope } from "lucide-react";
import { useId } from "react";
import { usePreferences } from "@/features/preferences/Preferences";
import { controlLabels } from "./catalog";
import type { SecurityOverview } from "./contracts";
import { useSecurityMessages } from "./messages";
export function ForensicLab({ data }: { data: SecurityOverview }) {
  const m = useSecurityMessages();
  const { locale } = usePreferences();
  const id = useId();
  const coverage = data.compliance.coverage_percent;
  return (
    <>
      <section className="panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-3 text-xl font-semibold">
            <Microscope size={24} />
            {m.compliance}
          </h2>
          <span className="tag">{m.notAssessed}</span>
        </div>
        <p className="subtext mt-4 max-w-3xl">{m.complianceHelp}</p>
        <div className="mt-8 grid items-center gap-8 md:grid-cols-[14rem_1fr]">
          <div
            role="progressbar"
            aria-valuenow={coverage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-labelledby={id}
            className="relative mx-auto size-48"
          >
            <svg
              viewBox="0 0 120 120"
              aria-hidden="true"
              className="size-full -rotate-90"
            >
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                strokeWidth="9"
                className="stroke-muted"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                pathLength="100"
                strokeWidth="9"
                strokeDasharray={`${coverage} 100`}
                strokeLinecap="round"
                className="stroke-good"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <strong className="text-4xl font-semibold">{coverage}%</strong>
              <span className="mt-2 text-xs text-secondary">
                {data.compliance.evidence_count} {m.records}
              </span>
            </div>
          </div>
          <div>
            <h3 id={id} className="text-lg font-semibold">
              {m.evidenceCoverage}
            </h3>
            <p className="subtext mt-3">{m.externalReview}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="tag">ISO/IEC 30107 · {m.notAssessed}</span>
              <span className="tag">FINMA · {m.notAssessed}</span>
            </div>
          </div>
        </div>
      </section>
      <div className="panel mt-6 overflow-auto">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead>
            <tr className="text-xs text-secondary">
              <th className="pb-4 pr-4">{m.control}</th>
              <th className="pb-4 pr-4">{m.records}</th>
              <th className="pb-4">{m.status}</th>
            </tr>
          </thead>
          <tbody>
            {data.compliance.controls.map((control) => (
              <tr key={control.id} className="border-t border-border">
                <th className="py-5 pr-4 font-medium">
                  {controlLabels[locale][control.id] || control.label}
                </th>
                <td className="py-5 pr-4 tabular-nums">
                  {control.evidence_count}
                </td>
                <td className="py-5 text-xs text-secondary">
                  {control.status === "evidence_present"
                    ? m.hasEvidence
                    : control.status === "not_assessed"
                      ? m.notAssessed
                      : m.noEvidence}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
