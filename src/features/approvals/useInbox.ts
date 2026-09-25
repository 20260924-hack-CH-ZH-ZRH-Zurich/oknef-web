import { useEffect, useRef, useState } from "react";
import { api, type User } from "@/lib/api";
import { approvalsSchema, invitationsSchema } from "./contracts";
export type InboxItem = { id: string; title: string };
export function useInbox(user: User | null, revision: unknown) {
  const [count, setCount] = useState(0);
  const [alerts, setAlerts] = useState<InboxItem[]>([]);
  const [unavailable, setUnavailable] = useState(false);
  const seen = useRef<Set<string> | null>(null);
  const id = user?.id;
  useEffect(() => {
    if (!id || !revision) return;
    let active = true;
    void Promise.all([
      api("/approvals", approvalsSchema),
      api("/invitations", invitationsSchema),
    ])
      .then(([approvals, invitations]) => {
        if (!active) return;
        const items: InboxItem[] = [
          ...approvals.requests
            .filter(
              (item) =>
                item.status === "pending" &&
                item.created_by !== id &&
                item.reviewer_ids.includes(id) &&
                !item.votes.some((vote) => vote.reviewer_id === id),
            )
            .map((item) => ({ id: item.id, title: item.title })),
          ...invitations.incoming
            .filter(
              (item) =>
                item.status === "pending" && item.recipient_user_id === id,
            )
            .map((item) => ({ id: item.id, title: item.workspace_name })),
        ];
        if (seen.current) {
          const incoming = items.filter((item) => !seen.current?.has(item.id));
          setAlerts((previous) => [...incoming, ...previous].slice(0, 4));
        }
        seen.current = new Set(items.map((item) => item.id));
        setCount(items.length);
        setUnavailable(false);
      })
      .catch(() => {
        if (active) setUnavailable(true);
      });
    return () => {
      active = false;
    };
  }, [id, revision]);
  return {
    count,
    alerts,
    unavailable,
    dismiss: (key: string) =>
      setAlerts((previous) => previous.filter((item) => item.id !== key)),
  };
}
