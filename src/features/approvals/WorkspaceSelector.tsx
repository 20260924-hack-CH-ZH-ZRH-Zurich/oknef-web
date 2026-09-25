import { useEffect, useState } from "react";
import { z } from "zod";
import { usePreferences } from "@/features/preferences/Preferences";
import { useSecurityMessages } from "@/features/security/messages";
import { api, mutation, userSchema } from "@/lib/api";
import { sessionBoundary } from "@/lib/mediaLifecycle";
import { workspacesSchema } from "./contracts";
export function WorkspaceSelector({ revision }: { revision: unknown }) {
  const m = useSecurityMessages();
  const { t } = usePreferences();
  const [data, setData] = useState<z.infer<typeof workspacesSchema> | null>(
    null,
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!revision) return;
    let active = true;
    void api("/workspaces", workspacesSchema)
      .then((value) => {
        if (active) setData(value);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [revision]);
  async function switchTo(tenant_id: string) {
    setPending(true);
    setError(false);
    try {
      await sessionBoundary(() =>
        api(
          "/workspaces/switch",
          z.object({ user: userSchema }).strict(),
          mutation("POST", { tenant_id }),
        ),
      );
      window.location.assign("/workspace");
    } catch {
      setError(true);
      setPending(false);
    }
  }
  return (
    <div>
      <label className="flex max-w-xl flex-wrap items-center gap-3 text-xs font-semibold">
        {m.workspace}
        <select
          className="field w-auto max-w-full"
          value={data?.current_tenant_id || ""}
          disabled={!data || pending}
          onChange={(event) => switchTo(event.target.value)}
        >
          {data?.workspaces.map((workspace) => (
            <option key={workspace.tenant_id} value={workspace.tenant_id}>
              {workspace.name} · {t(workspace.account_type)}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {m.error}
        </p>
      )}
    </div>
  );
}
