"use client";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Brand } from "@/components/ui/data-display/Brand/Brand";
import {
  PreferenceControls,
  usePreferences,
} from "@/features/preferences/Preferences";
export function Header() {
  const { t } = usePreferences();
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-6 md:px-10">
      <Link href="/" aria-label={t("home")}>
        <Brand />
      </Link>
      <nav
        aria-label={t("navigate")}
        className="hidden items-center gap-8 text-sm text-secondary lg:flex"
      >
        <Link href="/#platform" className="hover:text-foreground">
          {t("product")}
        </Link>
        <Link href="/#how" className="hover:text-foreground">
          {t("how")}
        </Link>
        <Link href="/workspace?view=security" className="hover:text-foreground">
          {t("trust")}
        </Link>
        <Link href="/deck/JO202609240900" className="hover:text-foreground">
          {t("pitch")}
        </Link>
      </nav>
      <div className="flex items-center gap-4">
        <PreferenceControls />
        <Link
          href="/login"
          className="hidden items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background sm:flex"
        >
          {t("signIn")}
          <ArrowUpRight size={16} />
        </Link>
      </div>
    </header>
  );
}
