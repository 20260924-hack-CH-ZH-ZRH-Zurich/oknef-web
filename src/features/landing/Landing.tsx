"use client";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  HeartHandshake,
  Layers3,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Brand } from "@/components/ui/data-display/Brand/Brand";
import { usePreferences } from "@/features/preferences/Preferences";
import { Header } from "./Header";
import { LandingPreview } from "./LandingPreview";
export function Landing() {
  const { t } = usePreferences();
  const cards = [
    { icon: Layers3, title: "landingCard1", body: "landingCard1Body" },
    { icon: HeartHandshake, title: "landingCard2", body: "landingCard2Body" },
    { icon: Sparkles, title: "landingCard3", body: "landingCard3Body" },
  ] as const;
  return (
    <>
      <Header />
      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-12 md:px-10 lg:grid-cols-2 lg:gap-16 lg:pb-28 lg:pt-16">
          <div>
            <p className="mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-xs text-secondary">
              <span className="size-1.5 rounded-full bg-good" />
              {t("heroBadge")}
            </p>
            <h1 className="max-w-xl whitespace-pre-line text-5xl font-medium leading-[1.08] tracking-[-.055em] md:text-6xl lg:text-7xl">
              {t("heroTitle")}
            </h1>
            <p className="mt-7 max-w-lg text-base leading-8 text-secondary md:text-lg">
              {t("heroBody")}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/login?demo=1"
                className="inline-flex items-center gap-3 rounded-full bg-accent px-6 py-4 text-sm font-semibold text-accent-ink"
              >
                {t("demo")}
                <ArrowUpRight size={18} />
              </Link>
              <Link
                href="/login?mode=register"
                className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-medium"
              >
                {t("start")}
                <ArrowRight size={17} />
              </Link>
            </div>
            <p className="mt-7 flex items-center gap-2 text-xs text-secondary">
              <CheckCircle2 size={14} className="text-good" />
              {t("heroNote")}
            </p>
          </div>
          <LandingPreview />
        </section>
        <section id="platform" className="border-y border-border bg-surface">
          <div className="mx-auto grid max-w-7xl gap-8 px-6 py-14 md:grid-cols-3 md:px-10">
            {cards.map(({ icon: Icon, title, body }) => (
              <article key={title}>
                <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-muted">
                  <Icon size={23} strokeWidth={1.5} />
                </div>
                <h2 className="text-lg font-semibold tracking-tight">
                  {t(title)}
                </h2>
                <p className="mt-3 max-w-sm text-sm leading-7 text-secondary">
                  {t(body)}
                </p>
              </article>
            ))}
          </div>
        </section>
        <section id="how" className="mx-auto max-w-7xl px-6 py-20 md:px-10">
          <div className="max-w-xl">
            <p className="eyebrow">{t("how")}</p>
            <h2 className="mt-4 text-4xl font-medium tracking-tight">
              {t("startSmall")}
            </h2>
            <p className="mt-4 leading-7 text-secondary">
              {t("startSmallBody")}
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {([1, 2, 3] as const).map((step) => (
              <div key={step} className="panel">
                <span className="mb-6 inline-flex size-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-ink">
                  0{step}
                </span>
                <h3 className="font-semibold">{t(`step${step}`)}</h3>
                <p className="subtext mt-3">{t(`step${step}Body`)}</p>
              </div>
            ))}
          </div>
          <div className="mt-14 flex flex-col items-start justify-between gap-6 rounded-3xl bg-rail p-8 text-white md:flex-row md:items-center md:p-12">
            <div>
              <h2 className="text-3xl font-medium tracking-tight">
                {t("wellbeing")}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-rail-muted">
                {t("securityNote")}
              </p>
            </div>
            <Link
              href="/login?demo=1"
              className="flex shrink-0 items-center gap-3 rounded-full bg-accent px-6 py-4 text-sm font-semibold text-accent-ink"
            >
              {t("demo")}
              <ArrowUpRight size={17} />
            </Link>
          </div>
        </section>
      </main>
      <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 border-t border-border px-6 py-8 md:px-10">
        <Brand />
        <p className="text-xs text-secondary">{t("footer")}</p>
        <Link className="text-xs text-secondary" href="/deck/JO202609240900">
          {t("pitch")} ↗
        </Link>
      </footer>
    </>
  );
}
