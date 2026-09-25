"use client";
import {
  Bell,
  CircleHelp,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { Toast } from "@/components/ui/feedback/Toast/Toast";
import { Approvals } from "@/features/approvals/Approvals";
import { useInbox } from "@/features/approvals/useInbox";
import { Assets } from "@/features/assets/Assets";
import { Chat } from "@/features/chat/Chat";
import { GlobalChat } from "@/features/chat/GlobalChat";
import { LocalFiles } from "@/features/files/LocalFiles";
import {
  PreferenceControls,
  usePreferences,
} from "@/features/preferences/Preferences";
import { Connections } from "@/features/product/Connections";
import { Drive } from "@/features/product/Drive";
import { IdentityWallet } from "@/features/product/IdentityWallet";
import { Integrations } from "@/features/product/Integrations";
import { MiniApps } from "@/features/product/MiniApps";
import { useProductMessages } from "@/features/product/messages";
import { PlatformLab } from "@/features/product/PlatformLab";
import { SessionsHub } from "@/features/product/SessionsHub";
import { useSecurityMessages } from "@/features/security/messages";
import { SecurityWorkspace } from "@/features/security/SecurityWorkspace";
import { ThreatTrend } from "@/features/security/ThreatTrend";
import { useSecurity } from "@/features/security/useSecurity";
import { Succession } from "@/features/succession/Succession";
import { AccountSettings, People } from "@/features/trust/TrustCenter";
import { Vault } from "@/features/vault/Vault";
import type { Dashboard, User } from "@/lib/api";
import type { TranslationKey } from "@/lib/i18n/en";
import { Navigation, type View, views } from "./Navigation";
import { Overview } from "./Overview";
import { Company } from "./Relationships";
export function WorkspaceContent({
  user,
  data,
  error,
  connected,
  refresh,
}: {
  user: User;
  data: Dashboard;
  error: TranslationKey | null;
  connected: boolean;
  refresh: () => Promise<void>;
}) {
  const { t } = usePreferences();
  const product = useProductMessages();
  const [chatOpen, setChatOpen] = useState(false);
  const params = useSearchParams();
  const security = useSecurity(data);
  const inbox = useInbox(user, data);
  const m = useSecurityMessages();
  const router = useRouter();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const requested = params.get("view") as View;
  const view = views.includes(requested) ? requested : "overview";
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <Navigation view={view} user={user} />
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between gap-4 border-b border-border bg-surface px-5 py-4 md:px-9">
          <div className="flex items-center gap-2 text-xs text-secondary">
            <span
              className={`size-1.5 rounded-full ${connected ? "bg-good" : "bg-secondary"}`}
            />
            {t(connected ? "connected" : "reconnecting")}
            <span className="mx-2 hidden h-3 w-px bg-border sm:block" />
            <span className="hidden sm:inline">{t("secureSession")}</span>
            <ShieldCheck size={12} className="hidden sm:block" />
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/workspace?view=approvals"
              className="relative inline-flex items-center gap-1.5 rounded-full border border-border p-2 text-secondary"
              title={inbox.unavailable ? m.inboxUnavailable : m.notifications}
              aria-label={`${m.notifications}: ${inbox.count}`}
            >
              <Bell size={16} />
              {inbox.count > 0 && (
                <span className="rounded-full bg-accent px-1.5 text-xs font-semibold text-accent-ink">
                  {inbox.count}
                </span>
              )}
            </Link>
            <button
              type="button"
              title={t("refresh")}
              aria-label={t("refresh")}
              className="icon-button hidden sm:flex"
              onClick={refresh}
            >
              <RefreshCw size={15} />
            </button>
            <Link
              href="/workspace?view=security"
              className="icon-button hidden sm:flex"
              title={t("securityDetails")}
              aria-label={t("securityDetails")}
            >
              <CircleHelp size={16} />
            </Link>
            <button
              type="button"
              className="icon-button"
              aria-label={product.assistant}
              title={product.assistant}
              onClick={() => setChatOpen(!chatOpen)}
            >
              <Sparkles size={17} />
            </button>
            <PreferenceControls />
          </div>
        </header>
        {user.demo && (
          <p className="border-b border-border bg-accent/10 px-5 py-2 text-center text-[.65rem] leading-5 text-secondary md:px-9">
            {t("demoNotice")}
          </p>
        )}
        <main className="mx-auto max-w-[100rem] px-5 py-7 md:px-9 md:py-9">
          {error && (
            <p
              role="alert"
              className="mb-6 rounded-xl bg-danger-soft p-3 text-sm text-danger"
            >
              {t(error)}
            </p>
          )}
          {view === "overview" && (
            <>
              <Overview data={data} user={user} refresh={refresh} />
              {security.data && <ThreatTrend data={security.data} />}
            </>
          )}{" "}
          {view === "vault" && (
            <Assets assets={data.assets} refresh={refresh} />
          )}{" "}
          {view === "secrets" && (
            <Vault owner={`${user.tenant_id}:${user.id}`} />
          )}
          {view === "files" && <LocalFiles />}
          {view === "approvals" && (
            <Approvals user={user} revision={data} refreshWorkspace={refresh} />
          )}
          {view === "assistant" && <Chat />}
          {view === "miniapps" && (
            <MiniApps key={params.get("app")} onSaved={security.refresh} />
          )}
          {view === "drive" && <Drive key={user.id} user={user} />}
          {view === "connections" && <Connections />}
          {view === "integrations" && <Integrations assets={data.assets} />}
          {view === "identities" && <IdentityWallet />}
          {view === "sessions" && <SessionsHub />}{" "}
          {view === "succession" && (
            <Succession plans={data.plans} refresh={refresh} />
          )}{" "}
          {view === "people" && <People data={data} />}{" "}
          {view === "security" &&
            (security.data ? (
              <SecurityWorkspace
                data={security.data}
                dashboard={data}
                user={user}
                refresh={security.refresh}
                initialSession={selectedSession}
                onClearSession={() => setSelectedSession(null)}
              />
            ) : (
              <section className="panel">
                <h1 className="page-title">{m.security}</h1>
                <p
                  role={security.error ? "alert" : "status"}
                  className="subtext mt-5"
                >
                  {security.error ? t(security.error) : m.loading}
                </p>
                <Button className="mt-5" onClick={security.refresh}>
                  {m.refresh}
                </Button>
              </section>
            ))}{" "}
          {view === "admin" && <PlatformLab />}{" "}
          {view === "settings" && <AccountSettings user={user} />}{" "}
          {view === "company" && <Company data={data} />}
        </main>
      </div>
      <GlobalChat
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        contextView={view}
      />
      {(security.alerts.length > 0 || inbox.alerts.length > 0) && (
        <aside
          aria-label={m.notifications}
          className="fixed bottom-5 right-5 z-50 w-[min(25rem,calc(100vw-2.5rem))] space-y-3"
        >
          {security.alerts.map((alert) => (
            <Toast
              key={alert.id}
              title={m.alert}
              body={`${alert.title}. ${m.alertHelp}`}
              actionLabel={m.viewEvidence}
              dismissLabel={m.dismiss}
              onDismiss={() => security.dismiss(alert.id)}
              onAction={() => {
                setSelectedSession(alert.session_id);
                security.dismiss(alert.id);
                router.push("/workspace?view=security");
              }}
            />
          ))}
          {inbox.alerts.map((alert) => (
            <Toast
              key={alert.id}
              title={m.decisionPending}
              body={alert.title}
              actionLabel={m.approvals}
              dismissLabel={m.dismiss}
              onDismiss={() => inbox.dismiss(alert.id)}
              onAction={() => {
                inbox.dismiss(alert.id);
                router.push("/workspace?view=approvals");
              }}
            />
          ))}
        </aside>
      )}
    </div>
  );
}
