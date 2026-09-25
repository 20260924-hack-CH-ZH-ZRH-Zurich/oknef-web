import { RefreshCw, ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { usePreferences } from "@/features/preferences/Preferences";
import { api, type Dashboard, mutation, type User } from "@/lib/api";
import { cn } from "@/lib/utils";
import { AssetTopology } from "./AssetTopology";
import { AttackMatrix } from "./AttackMatrix";
import {
  type SecurityOverview,
  type SecuritySession,
  type SessionKind,
  sessionSchema,
  settingsSchema,
} from "./contracts";
import { ForensicLab } from "./ForensicLab";
import { Learning } from "./Learning";
import { useSecurityMessages } from "./messages";
import { ProtectionExplainer } from "./ProtectionExplainer";
import { SessionDetail } from "./SessionDetail";
import { SessionForm } from "./SessionForm";
import { Sessions } from "./Sessions";
import { ThreatTrend } from "./ThreatTrend";

type Tab =
  | "sessions"
  | "matrix"
  | "forensic"
  | "topology"
  | "learn"
  | "protections";
export function SecurityWorkspace({
  data,
  dashboard,
  user,
  refresh,
  initialSession,
  onClearSession,
}: {
  data: SecurityOverview;
  dashboard: Dashboard;
  user: User;
  refresh: () => void;
  initialSession?: string | null;
  onClearSession: () => void;
}) {
  const m = useSecurityMessages();
  const params = useSearchParams();
  const selectedTab = params.get("tab");
  const [tab, setTab] = useState<Tab>(
    ["matrix", "forensic", "topology", "learn", "protections"].includes(
      selectedTab || "",
    )
      ? (selectedTab as Tab)
      : "sessions",
  );
  const [kind, setKind] = useState<SessionKind | null>(null);
  const [session, setSession] = useState<SecuritySession | null>(null);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);
  const { t } = usePreferences();
  useEffect(() => {
    if (!initialSession) return;
    let active = true;
    void api(
      `/security/sessions/${encodeURIComponent(initialSession)}`,
      sessionSchema,
    )
      .then((value) => {
        if (active) {
          setSession(value);
          setTab("sessions");
        }
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [initialSession]);
  async function select(id: string) {
    setPending(true);
    setError(false);
    try {
      setSession(
        await api(
          `/security/sessions/${encodeURIComponent(id)}`,
          sessionSchema,
        ),
      );
      setTab("sessions");
      onClearSession();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }
  async function mode(value: string) {
    setPending(true);
    setError(false);
    try {
      await api(
        "/security/mode",
        settingsSchema,
        mutation("PUT", { mode: value }),
      );
      refresh();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }
  function saved(value: SecuritySession) {
    setSession(value);
    setTab("sessions");
    refresh();
  }
  const active = session;
  return (
    <>
      <header className="mb-7 flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="eyebrow flex items-center gap-2">
            <ShieldCheck size={15} />
            {m.security}
          </p>
          <h1 className="page-title mt-3">{m.title}</h1>
          <p className="subtext mt-4 max-w-3xl">{m.intro}</p>
        </div>
        <Button variant="secondary" onClick={refresh}>
          <RefreshCw size={15} />
          {m.refresh}
        </Button>
      </header>
      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-surface p-4">
        <label className="flex items-center gap-3 text-xs font-semibold">
          {m.mode}
          <select
            className="field w-auto py-2"
            value={data.settings.mode}
            disabled={pending || user.role !== "owner"}
            onChange={(event) => mode(event.target.value)}
          >
            {(["standard", "active", "paranoid"] as const).map((value) => (
              <option key={value} value={value}>
                {m[value]}
              </option>
            ))}
          </select>
        </label>
        <p className="max-w-2xl text-xs leading-5 text-secondary">
          {m.modeHelp}
        </p>
      </div>
      <nav
        aria-label={m.security}
        className="mb-7 flex gap-2 overflow-x-auto border-b border-border pb-4"
      >
        {(
          [
            "sessions",
            "matrix",
            "forensic",
            "topology",
            "learn",
            "protections",
          ] as const
        ).map((item) => (
          <button
            type="button"
            key={item}
            aria-current={tab === item ? "page" : undefined}
            onClick={() => {
              setTab(item);
              setSession(null);
              onClearSession();
            }}
            className={cn(
              "shrink-0 rounded-full px-4 py-2.5 text-xs font-semibold",
              tab === item ? "bg-rail text-white" : "bg-muted text-secondary",
            )}
          >
            {m[item]}
          </button>
        ))}
      </nav>
      {error && (
        <p role="alert" className="mb-5 text-sm text-danger">
          {m.error}
        </p>
      )}
      {pending && (
        <output className="mb-5 block text-xs text-secondary">
          {t("loading")}
        </output>
      )}
      {tab === "sessions" &&
        (active ? (
          <SessionDetail
            session={active}
            onUpdated={saved}
            onBack={() => {
              setSession(null);
              onClearSession();
            }}
          />
        ) : (
          <>
            <Sessions
              sessions={data.sessions}
              onNew={setKind}
              onSelect={select}
            />
            <ThreatTrend data={data} />
          </>
        ))}
      {tab === "matrix" && <AttackMatrix data={data} onNew={setKind} />}{" "}
      {tab === "forensic" && <ForensicLab data={data} />}{" "}
      {tab === "topology" && (
        <AssetTopology dashboard={dashboard} security={data} />
      )}{" "}
      {tab === "learn" && <Learning onSaved={saved} />}{" "}
      {tab === "protections" && <ProtectionExplainer />}
      <SessionForm kind={kind} onClose={() => setKind(null)} onSaved={saved} />
    </>
  );
}
