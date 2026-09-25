import { ArrowUpRight, Crosshair, Shield } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { usePreferences } from "@/features/preferences/Preferences";
import { cn } from "@/lib/utils";
import { catalog } from "./catalog";
import {
  type SecurityOverview,
  type SessionKind,
  sessionKindSchema,
} from "./contracts";
import { useSecurityMessages } from "./messages";
export function AttackMatrix({
  data,
  onNew,
}: {
  data: SecurityOverview;
  onNew: (kind: SessionKind) => void;
}) {
  const m = useSecurityMessages();
  const { locale } = usePreferences();
  const [selected, setSelected] = useState("qr_phishing");
  const vector = data.attack_vectors.find((item) => item.id === selected);
  const detail = vector && catalog(locale, vector.id);
  const channel = sessionKindSchema.safeParse(vector?.channel);
  return (
    <>
      <section className="rounded-3xl bg-rail p-6 text-white">
        <Crosshair size={26} className="text-accent" />
        <h2 className="mt-4 text-xl font-semibold">{m.focus}</h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-rail-muted">
          {m.focusBody}
        </p>
      </section>
      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[1.25fr_1fr]">
        <div className="grid gap-3 sm:grid-cols-2">
          {data.attack_vectors.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => setSelected(item.id)}
              aria-pressed={selected === item.id}
              className={cn(
                "rounded-2xl border bg-surface p-5 text-left",
                selected === item.id ? "border-good" : "border-border",
              )}
            >
              <Shield size={20} className="mb-4 text-good" />
              <h3 className="text-sm font-semibold">
                {catalog(locale, item.id)?.title || item.title}
              </h3>
              <p className="mt-3 text-xs leading-5 text-secondary">
                {catalog(locale, item.id)?.validation || item.validation}
              </p>
            </button>
          ))}
        </div>
        {vector && detail && (
          <section className="panel">
            <p className="eyebrow">{m.selected}</p>
            <h3 className="mt-3 text-xl font-semibold">{detail.title}</h3>
            <dl className="mt-6 space-y-5">
              {(["impact", "mitigation", "validation"] as const).map((key) => (
                <div key={key}>
                  <dt className="text-xs font-semibold">{m[key]}</dt>
                  <dd className="subtext mt-2">{detail[key]}</dd>
                </div>
              ))}
            </dl>
            {channel.success && (
              <Button className="mt-6" onClick={() => onNew(channel.data)}>
                {m[channel.data]}
                <ArrowUpRight size={16} />
              </Button>
            )}
          </section>
        )}
      </div>
      <div className="panel mt-6 overflow-auto">
        <table className="w-full min-w-[42rem] text-left text-xs">
          <caption className="mb-5 text-left text-lg font-semibold">
            {m.matrix}
          </caption>
          <thead>
            <tr className="text-secondary">
              <th className="pb-4 pr-4">{m.matrix}</th>
              <th className="pb-4 pr-4">{m.mitigation}</th>
              <th className="pb-4">{m.validation}</th>
            </tr>
          </thead>
          <tbody>
            {data.attack_vectors.map((item) => {
              const row = catalog(locale, item.id);
              return (
                <tr key={item.id} className="border-t border-border">
                  <th className="py-4 pr-4 font-medium">
                    {row?.title || item.title}
                  </th>
                  <td className="py-4 pr-5 leading-6 text-secondary">
                    {row?.mitigation || item.mitigation}
                  </td>
                  <td className="py-4 leading-6 text-secondary">
                    {row?.validation || item.validation}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
