import { useState } from "react";
import { z } from "zod";
import { api, mutation, userSchema } from "@/lib/api";
import { sessionBoundary } from "@/lib/mediaLifecycle";
import { useProductMessages } from "./messages";
export function DemoSwitcher({
  enabled,
  onChanged,
}: {
  enabled: boolean;
  onChanged?: () => void;
}) {
  const m = useProductMessages();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  async function choose(mode: string) {
    if (!mode) return;
    setPending(true);
    setError(false);
    try {
      await sessionBoundary(() =>
        api(
          "/auth/demo",
          z.union([userSchema, z.object({ user: userSchema }).strict()]),
          mutation("POST", { mode }),
        ),
      );
      if (onChanged) onChanged();
      else window.location.assign("/workspace");
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }
  if (!enabled) return null;
  return (
    <div className="space-y-2">
      <label className="block text-xs">
        <span className="sr-only">{m.switchDemo}</span>
        <select
          aria-label={m.switchDemo}
          className="field py-2 text-xs"
          value=""
          disabled={pending}
          onChange={(event) => choose(event.target.value)}
        >
          <option value="">{m.switchDemo}</option>
          <option value="personal">{m.demoPersonal}</option>
          <option value="company">{m.demoCompany}</option>
          <option value="admin">{m.demoAdmin}</option>
        </select>
      </label>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {m.error}
        </p>
      )}
    </div>
  );
}
