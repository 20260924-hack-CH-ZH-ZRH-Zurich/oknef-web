import {
  Building2,
  CircleDollarSign,
  Download,
  Edit3,
  FileText,
  Globe2,
  KeyRound,
  Layers3,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/buttons/Button/Button";
import { Dialog } from "@/components/ui/overlays/Dialog/Dialog";
import { usePreferences } from "@/features/preferences/Preferences";
import { type Asset, api, errorKey, mutation } from "@/lib/api";
import type { TranslationKey } from "@/lib/i18n/en";
import { money } from "@/lib/utils";
import { AssetForm } from "./AssetForm";
export function AssetIcon({ category }: { category: string }) {
  const Icon =
    {
      finance: Building2,
      banking: Building2,
      financial: Building2,
      digital: Globe2,
      document: FileText,
      documents: FileText,
      crypto: KeyRound,
      property: CircleDollarSign,
    }[category] || Layers3;
  return <Icon size={19} strokeWidth={1.5} />;
}
export function Assets({
  assets,
  refresh,
  compact = false,
}: {
  assets: Asset[];
  refresh: () => void;
  compact?: boolean;
}) {
  const { t, locale } = usePreferences();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Asset | undefined>();
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<Asset | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<TranslationKey | null>(null);
  const visible = useMemo(
    () =>
      assets
        .map((asset) => ({
          ...asset,
          category:
            asset.category === "banking"
              ? "finance"
              : asset.category === "documents"
                ? "document"
                : asset.category,
        }))
        .filter((asset) =>
          `${asset.name} ${asset.category} ${asset.institution}`
            .toLocaleLowerCase(locale)
            .includes(search.toLocaleLowerCase(locale)),
        )
        .slice(0, compact ? 4 : 1000),
    [assets, search, compact, locale],
  );
  async function remove() {
    if (!deleting) return;
    setPending(true);
    try {
      await api(
        `/assets/${encodeURIComponent(deleting.id)}`,
        z.object({ deleted: z.boolean() }).strict(),
        mutation("DELETE"),
      );
      setDeleting(null);
      refresh();
    } catch (reason) {
      setError(errorKey(reason) as TranslationKey);
    } finally {
      setPending(false);
    }
  }
  function download() {
    const blob = new Blob(
      [
        JSON.stringify(
          { exported_at: new Date().toISOString(), assets },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "oknef-inventory.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return (
    <section className={compact ? "panel" : ""}>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className={compact ? "text-base font-semibold" : "page-title"}>
            {t(compact ? "yourAssets" : "vault")}
          </h2>
          {!compact && <p className="subtext mt-2">{t("assetHint")}</p>}
        </div>
        <div className="flex items-center gap-2">
          {!compact && (
            <button
              type="button"
              className="icon-button"
              onClick={download}
              aria-label={t("export")}
              title={t("export")}
            >
              <Download size={17} />
            </button>
          )}
          <Button
            variant={compact ? "ghost" : "primary"}
            onClick={() => {
              setEditing(undefined);
              setAdding(true);
            }}
          >
            <Plus size={16} />
            {t("newAsset")}
          </Button>
        </div>
      </header>
      {!compact && (
        <label className="relative mb-6 block max-w-md">
          <Search
            size={17}
            className="absolute left-4 top-3.5 text-secondary"
          />
          <input
            className="field pl-11"
            placeholder={t("search")}
            aria-label={t("search")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      )}
      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
          <Layers3 size={28} className="mx-auto mb-4 text-secondary" />
          <h3 className="font-semibold">
            {t(search ? "noResults" : "addFirstAsset")}
          </h3>
          <p className="subtext mt-2">{t("emptyAssetBody")}</p>
        </div>
      ) : (
        <div
          className={
            compact
              ? "divide-y divide-border"
              : "divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface"
          }
        >
          {visible.map((asset) => (
            <article
              key={asset.id}
              className={`flex items-center gap-3 py-4 ${compact ? "" : "px-4 md:px-6"}`}
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-secondary">
                <AssetIcon category={asset.category} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold">{asset.name}</h3>
                <p className="mt-1 truncate text-xs text-secondary">
                  {asset.institution || t("private")} ·{" "}
                  {[
                    "finance",
                    "digital",
                    "document",
                    "crypto",
                    "property",
                    "other",
                  ].includes(asset.category)
                    ? t(asset.category as TranslationKey)
                    : asset.category}
                </p>
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium tabular-nums">
                  {asset.value
                    ? money(asset.value, asset.currency, locale)
                    : "—"}
                </p>
                <span className="mt-1 inline-flex items-center gap-1 text-[.65rem] text-secondary">
                  <ShieldCheck size={10} />
                  {t("private")}
                </span>
              </div>
              <button
                type="button"
                className="icon-button ml-2 size-8 border-transparent"
                aria-label={`${t("edit")} ${asset.name}`}
                title={t("edit")}
                onClick={() => {
                  setEditing(asset);
                  setAdding(true);
                }}
              >
                <Edit3 size={14} />
              </button>
              {!compact && (
                <button
                  type="button"
                  className="icon-button size-8 border-transparent text-danger"
                  aria-label={`${t("delete")} ${asset.name}`}
                  title={t("delete")}
                  onClick={() => {
                    setError(null);
                    setDeleting(asset);
                  }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </article>
          ))}
        </div>
      )}
      <AssetForm
        open={adding}
        asset={editing}
        onClose={() => setAdding(false)}
        onSaved={refresh}
      />
      <Dialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={t("deleteAsset")}
        closeLabel={t("close")}
      >
        <p className="subtext">{t("confirmDelete")}</p>
        <p className="my-4 font-semibold">{deleting?.name}</p>
        {error && (
          <p role="alert" className="text-danger">
            {t(error)}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleting(null)}>
            {t("cancel")}
          </Button>
          <Button variant="danger" disabled={pending} onClick={remove}>
            {t("delete")}
          </Button>
        </div>
      </Dialog>
    </section>
  );
}
