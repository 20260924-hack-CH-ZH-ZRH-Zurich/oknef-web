import {
  ArrowUpRight,
  Building2,
  Check,
  ChevronRight,
  FileText,
  Globe2,
  HeartHandshake,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import { Brand } from "@/components/ui/data-display/Brand/Brand";
import { usePreferences } from "@/features/preferences/Preferences";
export function LandingPreview() {
  const { t } = usePreferences();
  return (
    <div className="relative mx-auto w-full max-w-lg py-8">
      <div className="absolute inset-8 rounded-full bg-accent/25 blur-3xl" />
      <div className="relative rounded-[2rem] border border-border bg-surface p-5 shadow-xl shadow-rail/5 md:p-7">
        <div className="mb-7 flex items-center justify-between">
          <Brand compact />
          <span className="tag">
            <span className="size-1.5 rounded-full bg-good" />
            {t("previewLabel")}
          </span>
        </div>
        <p className="eyebrow">{t("yourPlan")}</p>
        <h2 className="mt-3 max-w-xs text-3xl font-semibold leading-tight tracking-tight">
          {t("previewGreeting")}
        </h2>
        <div className="my-6 flex items-center gap-3 rounded-2xl bg-accent/20 px-4 py-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-accent text-accent-ink">
            <HeartHandshake size={19} />
          </div>
          <div>
            <p className="text-sm font-semibold">{t("previewReady")}</p>
            <p className="mt-0.5 text-xs text-secondary">{t("startSmall")}</p>
          </div>
          <ArrowUpRight size={18} className="ml-auto" />
        </div>
        <div className="space-y-3">
          {[
            [Building2, "previewAccount"],
            [FileText, "previewDocument"],
            [Globe2, "previewDigital"],
          ].map(([Icon, key]) => {
            const I = Icon as typeof Building2;
            return (
              <div
                key={String(key)}
                className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3"
              >
                <div className="flex size-9 items-center justify-center rounded-xl bg-muted text-secondary">
                  <I size={17} />
                </div>
                <span className="text-sm font-medium">
                  {t(key as "previewAccount")}
                </span>
                <Check size={15} className="ml-auto text-good" />
              </div>
            );
          })}
        </div>
        <div className="mt-6 flex items-center gap-2 border-t border-border pt-5 text-xs text-secondary">
          <LockKeyhole size={13} />
          {t("noTransfer")}
          <ChevronRight size={14} className="ml-auto" />
        </div>
      </div>
      <div className="absolute -bottom-1 right-3 flex items-center gap-3 rounded-2xl border border-border bg-surface px-5 py-4 shadow-lg md:-right-6">
        <div className="flex size-10 items-center justify-center rounded-full bg-rail text-accent">
          <Sparkles size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold">{t("assistant")}</p>
          <p className="text-xs text-secondary">{t("startSmall")}</p>
        </div>
      </div>
    </div>
  );
}
