import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { useSecurityMessages } from "@/features/security/messages";
import { api, type User } from "@/lib/api";
import {
  type ApprovalsData,
  approvalsSchema,
  type InvitationsData,
  invitationsSchema,
} from "./contracts";
import { DecisionRequests } from "./DecisionRequests";
import { Invitations } from "./Invitations";
import { PolicyForm } from "./PolicyForm";
import { WorkspaceSelector } from "./WorkspaceSelector";
export function Approvals({
  user,
  revision,
  refreshWorkspace,
}: {
  user: User;
  revision: unknown;
  refreshWorkspace: () => void;
}) {
  const m = useSecurityMessages();
  const [data, setData] = useState<ApprovalsData | null>(null);
  const [invitations, setInvitations] = useState<InvitationsData | null>(null);
  const [error, setError] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const [approvals, invites] = await Promise.all([
        api("/approvals", approvalsSchema),
        api("/invitations", invitationsSchema),
      ]);
      setData(approvals);
      setInvitations(invites);
      setError(false);
    } catch {
      setError(true);
    }
  }, []);
  useEffect(() => {
    if (revision) void refresh();
  }, [revision, refresh]);
  function saved() {
    void refresh();
    refreshWorkspace();
  }
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">{m.approvals}</p>
          <h1 className="page-title mt-3">{m.workflowTitle}</h1>
          <p className="subtext mt-4 max-w-3xl">{m.workflowHelp}</p>
        </div>
        <Button variant="secondary" onClick={refresh}>
          {m.refresh}
        </Button>
      </div>
      <div className="mt-5">
        <WorkspaceSelector revision={invitations} />
      </div>
      <div className="mt-5 rounded-xl border border-border bg-surface p-4">
        <p className="text-xs font-semibold">{m.accountId}</p>
        <code className="mt-2 block break-all text-sm">{user.id}</code>
        <p className="mt-2 text-xs leading-6 text-secondary">
          {m.accountIdHelp}
        </p>
      </div>
      {error && (
        <p role="alert" className="mt-5 text-sm text-danger">
          {m.error}
        </p>
      )}
      {!data || !invitations ? (
        <p className="subtext mt-6">{m.loading}</p>
      ) : (
        <>
          <div className="mt-6 grid items-start gap-6 xl:grid-cols-2">
            <Invitations data={invitations} user={user} onSaved={saved} />
            {user.role === "owner" && (
              <PolicyForm members={data.members} user={user} onSaved={saved} />
            )}
          </div>
          <DecisionRequests data={data} user={user} onSaved={saved} />
          <p className="mt-7 text-xs leading-6 text-secondary">
            {m.identityHelp}
          </p>
        </>
      )}
    </>
  );
}
