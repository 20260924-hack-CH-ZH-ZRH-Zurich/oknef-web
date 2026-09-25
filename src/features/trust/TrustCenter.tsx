import {
  ArrowUpRight,
  Eye,
  Fingerprint,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { PasskeyEnroll } from "@/features/auth/Passkeys";
import {
  PreferenceControls,
  usePreferences,
} from "@/features/preferences/Preferences";
import type { Dashboard, User } from "@/lib/api";
import { initials } from "@/lib/utils";
export function TrustCenter({
  admin = false,
  data,
}: {
  admin?: boolean;
  data: Dashboard;
}) {
  const { t } = usePreferences();
  const protections = [
    {
      title: "sessionProtection",
      body: "sessionProtectionBody",
      icon: LockKeyhole,
    },
    { title: "controlledAI", body: "controlledAIBody", icon: Sparkles },
    { title: "injection", body: "injectionBody", icon: ShieldCheck },
  ] as const;
  return (
    <>
      <p className="eyebrow">{t(admin ? "admin" : "security")}</p>
      <h1 className="page-title mt-3">{t("trustTitle")}</h1>
      <p className="subtext mt-4 max-w-2xl">
        {t(admin ? "adminBody" : "trustBody")}
      </p>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {protections.map(({ title, body, icon: Icon }) => (
          <section key={title} className="panel">
            <div className="mb-6 flex items-center justify-between">
              <Icon size={26} strokeWidth={1.4} className="text-good" />
              <span className="tag">{t("active")}</span>
            </div>
            <h2 className="text-lg font-semibold">{t(title)}</h2>
            <p className="subtext mt-3">{t(body)}</p>
          </section>
        ))}
      </div>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <section className="panel">
          <Fingerprint size={27} strokeWidth={1.4} />
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold">{t("futureSecurity")}</h2>
            <span className="tag">{t("planned")}</span>
          </div>
          <p className="subtext mt-3">{t("futureSecurityBody")}</p>
        </section>
        <section className="panel">
          <Eye size={27} strokeWidth={1.4} />
          <h2 className="mt-5 text-lg font-semibold">{t("humanGate")}</h2>
          <p className="subtext mt-3">{t("humanGateBody")}</p>
        </section>
      </div>
      <div className="mt-6 rounded-2xl border border-border bg-muted p-5 text-sm leading-7 text-secondary">
        {t("securityNote")}
      </div>
      {admin && (
        <section className="panel mt-6">
          <h2 className="mb-5 font-semibold">{t("capabilities")}</h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="flex justify-between border-b border-border pb-3 text-sm">
              <dt>{t("vault")}</dt>
              <dd className="text-secondary">
                {data.security.metadata_only ? t("noSecrets") : t("unknown")}
              </dd>
            </div>
            <div className="flex justify-between border-b border-border pb-3 text-sm">
              <dt>{t("recovery")}</dt>
              <dd className="text-secondary">
                {data.security.release_enabled ? t("active") : t("noTransfer")}
              </dd>
            </div>
          </dl>
          <p className="mt-5 text-xs text-secondary">{t("dataBoundary")}</p>
        </section>
      )}
    </>
  );
}
export function People({ data }: { data: Dashboard }) {
  const { t } = usePreferences();
  const emails = [
    ...new Set(data.plans.flatMap((plan) => plan.guardian_emails)),
  ];
  return (
    <>
      <h1 className="page-title">{t("guardianTitle")}</h1>
      <p className="subtext mt-4 max-w-2xl">{t("guardianBody")}</p>
      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {emails.map((email) => (
          <article key={email} className="panel">
            <span className="mb-5 flex size-12 items-center justify-center rounded-full bg-accent/25 font-semibold text-good">
              {email[0].toUpperCase()}
            </span>
            <h2 className="break-all text-base font-semibold">{email}</h2>
            <p className="mt-2 text-xs text-secondary">
              {t("guardian")} · {t("unknown")}
            </p>
            <p className="mt-5 border-t border-border pt-4 text-xs text-secondary">
              {t("assignedPlans")}:{" "}
              {
                data.plans.filter((plan) =>
                  plan.guardian_emails.includes(email),
                ).length
              }
            </p>
          </article>
        ))}
      </div>
      {emails.length === 0 && (
        <div className="panel mt-8 py-14 text-center">
          <UsersRound size={35} className="mx-auto text-secondary" />
          <p className="subtext mt-5">{t("noGuardians")}</p>
          <Link
            href="/workspace?view=succession"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-ink"
          >
            {t("createPlan")}
            <ArrowUpRight size={17} />
          </Link>
        </div>
      )}
      <p className="mt-6 text-xs text-secondary">{t("invitationNote")}</p>
    </>
  );
}
export function AccountSettings({ user }: { user: User }) {
  const { t } = usePreferences();
  return (
    <>
      <h1 className="page-title">{t("settings")}</h1>
      <section className="panel mt-8 max-w-2xl">
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-accent/30 text-lg font-semibold text-good">
            {initials(user.name)}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{user.name}</h2>
            <p className="subtext">{user.email}</p>
          </div>
        </div>
        <dl className="my-8 space-y-4 text-sm">
          <div className="flex justify-between border-b border-border pb-4">
            <dt className="text-secondary">{t("accountType")}</dt>
            <dd>{t(user.account_type)}</dd>
          </div>
          <div className="flex justify-between border-b border-border pb-4">
            <dt className="text-secondary">{t("role")}</dt>
            <dd>{user.role}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold">
              {t("language")} & {t("theme")}
            </h3>
            <p className="mt-1 text-xs text-secondary">{t("languageHint")}</p>
          </div>
          <PreferenceControls />
        </div>
      </section>
      {!user.demo && <PasskeyEnroll />}
    </>
  );
}
