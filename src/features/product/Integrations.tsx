import { type FormEvent, useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/buttons/Button/Button";
import { type Asset, api, mutation } from "@/lib/api";
import { integrationSchema } from "./contracts";
import { useProductMessages } from "./messages";
export function Integrations({ assets }: { assets: Asset[] }) {
  const m = useProductMessages();
  const [items, setItems] = useState<z.infer<typeof integrationSchema>[]>([]);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const value = await api(
        "/integrations",
        z.object({ integrations: z.array(integrationSchema) }).strict(),
      );
      setItems(value.integrations);
      setError(false);
    } catch {
      setError(true);
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    setPending(true);
    setError(false);
    try {
      await api(
        "/integrations",
        integrationSchema,
        mutation("POST", {
          name: fields.get("name"),
          provider: fields.get("provider"),
          account_label: fields.get("account"),
          asset_ids: fields.getAll("asset"),
        }),
      );
      form.reset();
      await refresh();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }
  async function remove(id: string) {
    setPending(true);
    try {
      await api(
        `/integrations/${encodeURIComponent(id)}`,
        z.object({ deleted: z.boolean() }).strict(),
        mutation("DELETE"),
      );
      await refresh();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="space-y-6">
      <header>
        <h1 className="page-title">{m.integrations}</h1>
        <p className="subtext mt-3 max-w-3xl">{m.integrationHelp}</p>
      </header>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {m.error}
        </p>
      )}
      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <form onSubmit={submit} className="panel space-y-4">
          <h2 className="font-semibold">{m.register}</h2>
          <label className="block">
            <span className="field-label">{m.name}</span>
            <input required maxLength={160} name="name" className="field" />
          </label>
          <label className="block">
            <span className="field-label">{m.provider}</span>
            <select name="provider" className="field">
              {["mail", "cloud-drive", "bank", "telecom", "custom"].map(
                (provider) => (
                  <option key={provider} value={provider}>
                    {provider}
                  </option>
                ),
              )}
            </select>
          </label>
          <label className="block">
            <span className="field-label">{m.account}</span>
            <input
              required
              maxLength={200}
              name="account"
              className="field"
              autoComplete="off"
            />
          </label>
          <fieldset>
            <legend className="field-label">{m.linkedAssets}</legend>
            <div className="max-h-44 space-y-2 overflow-auto">
              {assets.map((asset) => (
                <label className="flex gap-3 text-xs" key={asset.id}>
                  <input type="checkbox" name="asset" value={asset.id} />
                  {asset.name}
                </label>
              ))}
            </div>
          </fieldset>
          <Button type="submit" disabled={pending}>
            {m.save}
          </Button>
        </form>
        <div className="space-y-4">
          {items.map((item) => (
            <article className="panel" key={item.id}>
              <span className="tag">{item.provider}</span>
              <h2 className="mt-3 font-semibold">{item.name}</h2>
              <p className="subtext mt-2">{item.account_label}</p>
              <p className="mt-3 text-xs text-secondary">{m.registered}</p>
              <p className="mt-2 text-xs">
                {item.asset_ids.length} · {m.linkedAssets}
              </p>
              <Button
                variant="ghost"
                className="mt-4"
                disabled={pending}
                onClick={() => remove(item.id)}
              >
                {m.remove}
              </Button>
            </article>
          ))}
          {items.length === 0 && <p className="panel subtext">{m.empty}</p>}
        </div>
      </div>
    </section>
  );
}
