import { ShieldCheck } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { Dialog } from "@/components/ui/overlays/Dialog/Dialog";
import { usePreferences } from "@/features/preferences/Preferences";
import { type Asset, api, assetSchema, errorKey, mutation } from "@/lib/api";
import type { TranslationKey } from "@/lib/i18n/en";
export function AssetForm({
  open,
  asset,
  onClose,
  onSaved,
}: {
  open: boolean;
  asset?: Asset;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = usePreferences();
  const [error, setError] = useState<TranslationKey | null>(null);
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const data = {
      name: String(values.get("name") || "").trim(),
      category: values.get("category"),
      institution: String(values.get("institution") || "").trim(),
      value: Number(values.get("value") || 0),
      currency: values.get("currency"),
      notes: String(values.get("notes") || "").trim(),
      beneficiary: String(values.get("beneficiary") || "").trim(),
    };
    setSaving(true);
    setError(null);
    try {
      await api(
        asset ? `/assets/${encodeURIComponent(asset.id)}` : "/assets",
        assetSchema,
        mutation(asset ? "PATCH" : "POST", data),
      );
      onSaved();
      onClose();
    } catch (reason) {
      setError(errorKey(reason) as TranslationKey);
    } finally {
      setSaving(false);
    }
  }
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t(asset ? "edit" : "newAsset")}
      closeLabel={t("close")}
    >
      <form
        onSubmit={submit}
        key={`${asset?.id || "new"}-${open}`}
        className="space-y-4"
      >
        <p className="mb-5 flex gap-2 rounded-xl bg-muted p-3 text-xs leading-5 text-secondary">
          <ShieldCheck size={16} className="mt-0.5 shrink-0" />
          {t("assetHint")}
        </p>
        <label className="block">
          <span className="field-label">{t("assetName")} *</span>
          <input
            name="name"
            className="field"
            defaultValue={asset?.name}
            placeholder={t("assetPlaceholder")}
            required
            maxLength={200}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="field-label">{t("category")}</span>
            <select
              name="category"
              className="field"
              defaultValue={asset?.category || "finance"}
            >
              {(
                [
                  "finance",
                  "digital",
                  "document",
                  "crypto",
                  "property",
                  "other",
                ] as const
              ).map((key) => (
                <option key={key} value={key}>
                  {t(key)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="field-label">{t("institution")}</span>
            <input
              name="institution"
              className="field"
              defaultValue={asset?.institution}
              maxLength={200}
            />
          </label>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <label className="col-span-2">
            <span className="field-label">{t("amountOptional")}</span>
            <input
              name="value"
              type="number"
              className="field"
              defaultValue={asset?.value || ""}
              min={0}
              max={999999999999}
              step="0.01"
            />
          </label>
          <label>
            <span className="field-label">{t("currency")}</span>
            <select
              name="currency"
              className="field"
              defaultValue={asset?.currency || "CHF"}
            >
              <option>CHF</option>
              <option>EUR</option>
              <option>USD</option>
              <option>GBP</option>
            </select>
          </label>
        </div>
        <label className="block">
          <span className="field-label">{t("beneficiary")}</span>
          <input
            name="beneficiary"
            className="field"
            defaultValue={asset?.beneficiary}
            maxLength={200}
          />
        </label>
        <label className="block">
          <span className="field-label">{t("notes")}</span>
          <textarea
            name="notes"
            className="field"
            rows={3}
            defaultValue={asset?.notes}
            maxLength={2000}
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {t(error)}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={saving}>
            {t(saving ? "processing" : "save")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
