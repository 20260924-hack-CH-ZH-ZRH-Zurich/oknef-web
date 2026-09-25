import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { Dialog } from "@/components/ui/overlays/Dialog/Dialog";
import { usePreferences } from "@/features/preferences/Preferences";
import { api, errorKey, mutation, planSchema } from "@/lib/api";
import type { TranslationKey } from "@/lib/i18n/en";
export function PlanForm({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = usePreferences();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<TranslationKey | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const guardians = String(form.get("guardians") || "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    const approvals = Number(form.get("approvals"));
    if (
      guardians.length < approvals ||
      new Set(guardians).size !== guardians.length ||
      guardians.some((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    ) {
      setError("formRequired");
      return;
    }
    setPending(true);
    setError(null);
    try {
      await api(
        "/succession",
        planSchema,
        mutation("POST", {
          title: String(form.get("title") || "").trim(),
          beneficiary: String(form.get("beneficiary") || "").trim(),
          guardian_emails: guardians,
          required_approvals: approvals,
          waiting_days: Number(form.get("days")),
        }),
      );
      onSaved();
      onClose();
    } catch (reason) {
      setError(errorKey(reason) as TranslationKey);
    } finally {
      setPending(false);
    }
  }
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t("createPlan")}
      closeLabel={t("close")}
    >
      <form key={String(open)} onSubmit={submit} className="space-y-4">
        <p className="rounded-xl bg-muted p-3 text-xs leading-5 text-secondary">
          {t("planHelp")}
        </p>
        <label className="block">
          <span className="field-label">{t("planName")} *</span>
          <input
            name="title"
            required
            maxLength={200}
            className="field"
            placeholder={t("planPlaceholder")}
          />
        </label>
        <label className="block">
          <span className="field-label">{t("beneficiary")} *</span>
          <input
            name="beneficiary"
            required
            maxLength={200}
            className="field"
          />
        </label>
        <label className="block">
          <span className="field-label">{t("guardianNames")} *</span>
          <textarea
            name="guardians"
            required
            maxLength={2000}
            rows={2}
            className="field"
          />
          <span className="mt-2 block text-xs leading-5 text-secondary">
            {t("guardianHint")}
          </span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label>
            <span className="field-label">{t("quorum")}</span>
            <input
              name="approvals"
              type="number"
              min={1}
              max={10}
              defaultValue={2}
              required
              className="field"
            />
          </label>
          <label>
            <span className="field-label">{t("waitingDays")}</span>
            <input
              name="days"
              type="number"
              min={7}
              max={365}
              defaultValue={30}
              required
              className="field"
            />
          </label>
        </div>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {t(error)}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-3">
          <Button variant="ghost" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {t(pending ? "processing" : "save")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
