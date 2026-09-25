"use client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/buttons/Button/Button";
import { Brand } from "@/components/ui/data-display/Brand/Brand";
import { usePreferences } from "@/features/preferences/Preferences";
import { useWorkspace } from "./useWorkspace";
import { WorkspaceContent } from "./WorkspaceContent";

export function Workspace() {
  const { t } = usePreferences();
  const workspace = useWorkspace();
  const { user, data, error, refresh } = workspace;
  if (!user || !data)
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-7 p-6">
        <Brand />
        <output className="subtext">{t(error || "loading")}</output>
        {error && <Button onClick={refresh}>{t("retry")}</Button>}
        <Link
          href="/"
          className="flex items-center gap-2 text-xs text-secondary"
        >
          <ArrowLeft size={14} />
          {t("home")}
        </Link>
      </main>
    );
  return (
    <WorkspaceContent
      key={`${user.tenant_id}:${user.id}`}
      {...workspace}
      user={user}
      data={data}
    />
  );
}
