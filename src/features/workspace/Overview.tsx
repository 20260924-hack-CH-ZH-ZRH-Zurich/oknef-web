import {
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  HeartHandshake,
  Layers3,
  Sparkles,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { Assets } from "@/features/assets/Assets";
import { usePreferences } from "@/features/preferences/Preferences";
import type { Dashboard, User } from "@/lib/api";
export function Overview({
  data,
  user,
  refresh,
}: {
  data: Dashboard;
  user: User;
  refresh: () => void;
}) {
  const { t } = usePreferences();
  const guardians = new Set(data.plans.flatMap((plan) => plan.guardian_emails))
    .size;
  const stats = [
    {
      label: "assetsCount",
      value: data.assets.length,
      icon: Layers3,
      href: "vault",
    },
    {
      label: "legacyCount",
      value: data.plans.length,
      icon: HeartHandshake,
      href: "succession",
    },
    {
      label: "trustedCount",
      value: guardians,
      icon: UsersRound,
      href: "people",
    },
  ] as const;
  return (
    <>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">
            {t(
              user.account_type === "family"
                ? "familyView"
                : user.account_type === "company"
                  ? "companyView"
                  : "personalView",
            )}
          </p>
          <h1 className="mt-3 text-3xl font-medium tracking-tight md:text-4xl">
            {t("greeting")}, {user.name.split(" ")[0]}
            <span className="text-good">.</span>
          </h1>
          <p className="subtext mt-3">{t("workspaceSubtitle")}</p>
        </div>
        <Link
          href="/workspace?view=assistant"
          className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-3 text-xs font-semibold"
        >
          <Sparkles size={16} className="text-good" />
          {t("askAssistant")}
          <ArrowUpRight size={15} />
        </Link>
      </div>
      <div className="mb-7 grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={`/workspace?view=${href}`}
            className="panel flex items-start justify-between transition hover:border-good/40"
          >
            <div>
              <p className="text-xs text-secondary">{t(label)}</p>
              <p className="mt-4 text-4xl font-medium tabular-nums tracking-tight">
                {value.toString().padStart(2, "0")}
              </p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-secondary">
              <Icon size={19} strokeWidth={1.4} />
            </div>
          </Link>
        ))}
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[1.65fr_1fr]">
        <Assets assets={data.assets} refresh={refresh} compact />
        <section className="relative overflow-hidden rounded-3xl bg-rail p-7 text-white">
          <div className="mb-6 flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-accent">
            <HeartHandshake size={23} strokeWidth={1.5} />
          </div>
          <h2 className="max-w-xs text-2xl font-medium tracking-tight">
            {t("legacyReady")}
          </h2>
          <p className="mt-4 text-sm leading-7 text-rail-muted">
            {t("legacyBody")}
          </p>
          <Link
            href="/workspace?view=succession"
            className="mt-7 flex items-center justify-between rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-ink"
          >
            {t("continuePlanning")}
            <ArrowUpRight size={18} />
          </Link>
          <p className="mt-5 flex items-center gap-1.5 text-[.65rem] text-rail-muted">
            <CheckCircle2 size={12} />
            {t("noTransfer")}
          </p>
        </section>
      </div>
      <section className="mt-7">
        <h2 className="mb-5 text-base font-semibold">{t("nextSteps")}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {([1, 2, 3] as const).map((step) => (
            <Link
              href={`/workspace?view=${step === 1 ? "vault" : step === 2 ? "people" : "succession"}`}
              key={step}
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-secondary">
                0{step}
              </span>
              <span className="text-xs font-medium">{t(`step${step}`)}</span>
              <ChevronRight
                size={15}
                className="ml-auto shrink-0 text-secondary"
              />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
