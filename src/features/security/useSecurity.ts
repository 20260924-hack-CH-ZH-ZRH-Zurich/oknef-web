import { useCallback, useEffect, useRef, useState } from "react";
import { api, errorKey } from "@/lib/api";
import type { TranslationKey } from "@/lib/i18n/en";
import {
  type SecurityEvent,
  type SecurityOverview,
  securityOverviewSchema,
} from "./contracts";

export function unseenAlerts(events: SecurityEvent[], known: Set<string>) {
  return events.filter(
    (event) =>
      !known.has(event.id) &&
      !event.synthetic &&
      event.type === "security.review_required",
  );
}

export function useSecurity(revision: unknown) {
  const [data, setData] = useState<SecurityOverview | null>(null);
  const [error, setError] = useState<TranslationKey | null>(null);
  const [alerts, setAlerts] = useState<SecurityEvent[]>([]);
  const known = useRef<Set<string> | null>(null);
  const request = useRef(0);
  const refresh = useCallback(async () => {
    const sequence = ++request.current;
    try {
      const next = await api("/security/overview", securityOverviewSchema);
      if (sequence !== request.current) return;
      if (known.current) {
        const incoming = unseenAlerts(next.events, known.current);
        setAlerts((previous) => [...incoming, ...previous].slice(0, 5));
      }
      known.current = new Set(next.events.map((event) => event.id));
      setData(next);
      setError(null);
    } catch (reason) {
      if (sequence === request.current)
        setError(errorKey(reason) as TranslationKey);
    }
  }, []);
  useEffect(() => {
    if (revision) void refresh();
  }, [revision, refresh]);
  useEffect(
    () => () => {
      request.current++;
    },
    [],
  );
  return {
    data,
    error,
    alerts,
    refresh,
    dismiss: (id: string) =>
      setAlerts((previous) => previous.filter((alert) => alert.id !== id)),
  };
}
