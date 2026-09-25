import {
  ArrowUpRight,
  Building2,
  FileLock2,
  Fingerprint,
  FolderLock,
  GitPullRequest,
  Grid2X2,
  HeartHandshake,
  Layers3,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  MessagesSquare,
  Network,
  Plug,
  Settings2,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Brand } from "@/components/ui/data-display/Brand/Brand";
import { usePreferences } from "@/features/preferences/Preferences";
import { DemoSwitcher } from "@/features/product/DemoSwitcher";
import { useProductMessages } from "@/features/product/messages";
import { securityMessages } from "@/features/security/messages";
import { vaultMessages } from "@/features/vault/messages";
import type { User } from "@/lib/api";
import { sessionBoundary } from "@/lib/mediaLifecycle";
import { cn, initials } from "@/lib/utils";
export type View =
  | "drive"
  | "connections"
  | "miniapps"
  | "integrations"
  | "identities"
  | "sessions"
  | "overview"
  | "vault"
  | "secrets"
  | "files"
  | "approvals"
  | "assistant"
  | "succession"
  | "people"
  | "security"
  | "company"
  | "admin"
  | "settings";
export const views: View[] = [
  "drive",
  "connections",
  "miniapps",
  "integrations",
  "identities",
  "sessions",
  "overview",
  "vault",
  "secrets",
  "files",
  "approvals",
  "assistant",
  "succession",
  "people",
  "security",
  "company",
  "admin",
  "settings",
];
export function Navigation({ view, user }: { view: View; user: User }) {
  const { t, locale } = usePreferences();
  const router = useRouter();
  const product = useProductMessages();
  const [logoutError, setLogoutError] = useState(false);
  const links = [
    { key: "overview", icon: LayoutDashboard },
    { key: "miniapps", icon: Grid2X2 },
    { key: "drive", icon: FolderLock },
    { key: "connections", icon: Network },
    { key: "identities", icon: Fingerprint },
    { key: "integrations", icon: Plug },
    { key: "sessions", icon: MessagesSquare },
    { key: "vault", icon: Layers3 },
    { key: "secrets", icon: LockKeyhole },
    { key: "files", icon: FileLock2 },
    { key: "assistant", icon: Sparkles },
    { key: "succession", icon: HeartHandshake },
    { key: "approvals", icon: GitPullRequest },
    { key: "people", icon: UsersRound },
    { key: "security", icon: ShieldCheck },
    ...(user.account_type !== "personal"
      ? [{ key: "company", icon: Building2 }]
      : []),
    ...(user.role === "owner" ? [{ key: "admin", icon: Settings2 }] : []),
    { key: "settings", icon: Settings2 },
  ] as const;
  async function logout() {
    setLogoutError(false);
    try {
      const response = await sessionBoundary(() =>
        fetch("/api/auth/logout", {
          method: "POST",
          credentials: "same-origin",
        }),
      );
      if (!response.ok) throw new Error("logout failed");
      router.replace("/login");
    } catch {
      setLogoutError(true);
    }
  }

  return (
    <aside className="flex shrink-0 flex-col bg-rail text-white lg:sticky lg:top-0 lg:h-dvh lg:w-60">
      <div className="flex items-center justify-between px-5 py-5 lg:px-7 lg:py-8">
        <Link href="/" aria-label={t("home")}>
          <Brand inverse />
        </Link>
        <span className="rounded-full border border-white/15 px-2 py-1 text-[.6rem] uppercase tracking-wider text-rail-muted lg:hidden">
          {t(user.account_type)}
        </span>
        <button
          type="button"
          className="text-rail-muted lg:hidden"
          onClick={logout}
          title={t("signOut")}
          aria-label={t("signOut")}
        >
          <LogOut size={18} />
        </button>
      </div>
      {logoutError && (
        <p role="alert" className="mx-4 mb-3 text-xs text-white">
          {t("error")}
        </p>
      )}
      <div className="mx-4 mb-7 hidden rounded-xl border border-white/10 p-3 lg:block">
        <p className="text-xs font-semibold">
          {t(user.account_type)} {t("workspace")}
        </p>
        <p className="mt-1 text-[.65rem] text-rail-muted">
          {user.demo ? t("beta") : user.name}
        </p>
      </div>
      {user.demo && (
        <div className="mx-4 mb-4 text-foreground">
          <DemoSwitcher
            enabled
            onChanged={() => window.location.assign(`/${locale}/workspace`)}
          />
        </div>
      )}
      <nav
        aria-label={t("overviewNav")}
        className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-4 lg:overflow-y-auto"
      >
        {links.map(({ key, icon: Icon }) => (
          <Link
            key={key}
            href={`/${locale}/workspace?view=${key}`}
            aria-current={view === key ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-xs font-medium transition lg:text-sm",
              view === key
                ? "bg-accent text-accent-ink"
                : "text-rail-muted hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon size={18} strokeWidth={1.7} />
            {key in product
              ? product[key as keyof typeof product]
              : key === "files" || key === "approvals"
                ? securityMessages[locale][key]
                : key === "secrets"
                  ? vaultMessages[locale].title
                  : t(
                      key === "company" && user.account_type === "family"
                        ? "family"
                        : (key as "overview"),
                    )}
          </Link>
        ))}
      </nav>
      <div className="mt-auto hidden px-4 pb-5 lg:block">
        <Link
          href="/deck/JO202609240900"
          className="mb-5 flex items-center justify-between rounded-2xl border border-white/10 p-4 text-xs text-rail-muted"
        >
          {t("pitch")}
          <ArrowUpRight size={16} />
        </Link>
        <div className="flex items-center gap-3 border-t border-white/10 px-1 pt-5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
            {initials(user.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium">{user.name}</p>
            <Link
              href="/workspace?view=settings"
              className="mt-1 block text-[.65rem] text-rail-muted"
            >
              {t("account")}
            </Link>
          </div>
          <button
            type="button"
            aria-label={t("signOut")}
            title={t("signOut")}
            className="ml-auto text-rail-muted hover:text-white"
            onClick={logout}
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </aside>
  );
}
