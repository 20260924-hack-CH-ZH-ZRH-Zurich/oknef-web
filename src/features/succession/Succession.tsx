import {
  ArrowUpRight,
  Clock3,
  HeartHandshake,
  Plus,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { usePreferences } from "@/features/preferences/Preferences";
import { api, errorKey, mutation, type Plan, planSchema } from "@/lib/api";
import type { TranslationKey } from "@/lib/i18n/en";
import { PlanForm } from "./PlanForm";
export function Succession({
  plans,
  refresh,
}: {
  plans: Plan[];
  refresh: () => void;
}) {
  const { t } = usePreferences();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<TranslationKey | null>(null);
  async function review(plan: Plan) {
    setPending(plan.id);
    setError(null);
    try {
      await api(
        `/succession/${encodeURIComponent(plan.id)}/review`,
        planSchema,
        mutation("POST", {}),
      );
      refresh();
    } catch (reason) {
      setError(errorKey(reason) as TranslationKey);
    } finally {
      setPending(null);
    }
  }
  return (
    <>
      <header className="mb-7 flex flex-wrap justify-between gap-5">
        <div>
          <h1 className="page-title">{t("succession")}</h1>
          <p className="subtext mt-3 max-w-2xl">{t("legacyBody")}</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} />
          {t("createPlan")}
        </Button>
      </header>
      <div className="mb-6 flex gap-3 rounded-2xl border border-border bg-surface p-5">
        <ShieldCheck size={21} className="shrink-0 text-good" />
        <p className="text-xs leading-6 text-secondary">
          {t("successionNotice")}
        </p>
      </div>
      {error && (
        <p role="alert" className="mb-5 text-sm text-danger">
          {t(error)}
        </p>
      )}
      {plans.length === 0 ? (
        <div className="panel py-16 text-center">
          <HeartHandshake size={42} className="mx-auto text-good" />
          <h2 className="mt-6 text-2xl font-medium">{t("noPlans")}</h2>
          <p className="subtext mx-auto mt-3 max-w-lg">{t("noPlansBody")}</p>
          <Button className="mt-7" onClick={() => setOpen(true)}>
            {t("createPlan")}
            <ArrowUpRight size={17} />
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {plans.map((plan) => (
            <article key={plan.id} className="panel">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-accent/20 text-good">
                  <HeartHandshake size={23} />
                </div>
                <span className="tag">
                  {t(
                    plan.status === "review_requested"
                      ? "reviewRequested"
                      : plan.status === "cancelled"
                        ? "cancel"
                        : "draft",
                  )}
                </span>
              </div>
              <h2 className="text-xl font-semibold tracking-tight">
                {plan.title}
              </h2>
              <p className="subtext mt-2">
                {t("beneficiary")}: {plan.beneficiary}
              </p>
              <div className="my-6 space-y-3 border-y border-border py-5">
                <p className="flex items-center gap-2 text-sm text-secondary">
                  <UsersRound size={16} />
                  {t("quorum")}:{" "}
                  <strong className="ml-auto text-foreground">
                    {plan.required_approvals} / {plan.guardian_emails.length}
                  </strong>
                </p>
                <p className="flex items-center gap-2 text-sm text-secondary">
                  <Clock3 size={16} />
                  {t("waitingDays")}:{" "}
                  <strong className="ml-auto text-foreground">
                    {plan.waiting_days}
                  </strong>
                </p>
              </div>
              <div className="mb-5 flex flex-wrap gap-2">
                {plan.guardian_emails.map((email) => (
                  <span
                    key={email}
                    className="tag max-w-full truncate"
                    title={t("noIdentity")}
                  >
                    {email}
                  </span>
                ))}
              </div>
              <Button
                variant="secondary"
                className="w-full"
                disabled={plan.status !== "draft" || pending === plan.id}
                onClick={() => review(plan)}
              >
                {t(
                  plan.status === "review_requested"
                    ? "reviewRequested"
                    : "requestReview",
                )}
                <ArrowUpRight size={16} />
              </Button>
            </article>
          ))}
        </div>
      )}
      <PlanForm open={open} onClose={() => setOpen(false)} onSaved={refresh} />
    </>
  );
}
