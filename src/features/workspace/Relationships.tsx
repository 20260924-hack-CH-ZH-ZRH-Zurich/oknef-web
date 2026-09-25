import { HeartHandshake, Layers3, UserRound, UsersRound } from "lucide-react";
import { usePreferences } from "@/features/preferences/Preferences";
import type { Dashboard } from "@/lib/api";
export function Relationships({ data }: { data: Dashboard }) {
  const { t } = usePreferences();
  const guardians = [
    ...new Set(data.plans.flatMap((plan) => plan.guardian_emails)),
  ];
  return (
    <section className="panel">
      <h2 className="font-semibold">{t("graphTitle")}</h2>
      <p className="subtext mt-2">{t("graphNote")}</p>
      <div className="relative mx-auto my-8 grid max-w-xl grid-cols-3 gap-3">
        <div className="col-span-3 mx-auto flex size-20 items-center justify-center rounded-full border border-accent bg-accent/20 text-good">
          <UserRound size={32} strokeWidth={1.3} />
        </div>
        <svg
          viewBox="0 0 300 50"
          className="col-span-3 h-12 w-full text-border"
          aria-hidden="true"
        >
          <path
            d="M150 0V25M50 50V25H250V50M150 25V50"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
        {[
          { icon: Layers3, label: "inventoryNode", count: data.assets.length },
          {
            icon: HeartHandshake,
            label: "plansNode",
            count: data.plans.length,
          },
          { icon: UsersRound, label: "guardiansNode", count: guardians.length },
        ].map(({ icon: Icon, label, count }) => (
          <div
            key={label}
            className="rounded-2xl border border-border bg-background p-4 text-center"
          >
            <Icon className="mx-auto mb-3 text-good" size={21} />
            <p className="text-2xl font-medium">{count}</p>
            <p className="mt-1 text-xs text-secondary">
              {t(label as "inventoryNode")}
            </p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {data.assets.slice(0, 5).map((asset) => (
          <span key={asset.id} className="tag">
            {asset.name}
          </span>
        ))}
      </div>
    </section>
  );
}
export function Company({ data }: { data: Dashboard }) {
  const { t } = usePreferences();
  return (
    <>
      <p className="eyebrow">{t(data.account_type)}</p>
      <h1 className="page-title mt-3">
        {t(data.account_type === "family" ? "familyView" : "companyView")}
      </h1>
      <p className="subtext mt-4 max-w-2xl">
        {t(data.account_type === "family" ? "familyBody" : "companyBody")}
      </p>
      <div className="mt-8 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Relationships data={data} />
        <section className="panel">
          <h2 className="mb-5 font-semibold">{t("member")}</h2>
          <div className="divide-y divide-border">
            {data.members.map((member) => (
              <div key={member.id} className="py-4">
                <h3 className="text-sm font-semibold">{member.name}</h3>
                <p className="mt-1 break-all text-xs text-secondary">
                  {member.email}
                </p>
                <span className="tag mt-3">{member.role}</span>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs leading-6 text-secondary">
            {t("invitationNote")}
          </p>
        </section>
      </div>
    </>
  );
}
