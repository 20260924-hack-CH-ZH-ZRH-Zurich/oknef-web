"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import {
  ApiError,
  api,
  type Dashboard,
  dashboardSchema,
  errorKey,
  type User,
  userSchema,
} from "@/lib/api";
import type { TranslationKey } from "@/lib/i18n/en";
import { listenSessionChange, stopActiveMedia } from "@/lib/mediaLifecycle";
export function useWorkspace() {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<TranslationKey | null>(null);
  const [connected, setConnected] = useState(false);
  const router = useRouter();
  const alive = useRef(true);
  const identity = useRef<string | null>(null);
  const revision = useRef(0);
  const changing = useRef(false);
  const refresh = useCallback(async () => {
    if (changing.current) return;
    const request = ++revision.current;
    try {
      const [me, dashboard] = await Promise.all([
        api(
          "/auth/me",
          z.union([userSchema, z.object({ user: userSchema }).strict()]),
        ),
        api("/dashboard", dashboardSchema),
      ]);
      if (!alive.current || request !== revision.current) return;
      const currentUser = "user" in me ? me.user : me;
      const scope = `${currentUser.tenant_id}:${currentUser.id}`;
      if (identity.current && identity.current !== scope) stopActiveMedia();
      identity.current = scope;
      setUser(currentUser);
      setData(dashboard);
      setError(null);
    } catch (reason) {
      if (!alive.current || request !== revision.current) return;
      if (reason instanceof ApiError && reason.status === 401) {
        stopActiveMedia();
        if (alive.current) {
          setUser(null);
          setData(null);
        }
        router.replace("/login");
      }
      if (alive.current) setError(errorKey(reason) as TranslationKey);
    }
  }, [router]);
  useEffect(() => {
    alive.current = true;
    refresh();
    return () => {
      alive.current = false;
      revision.current++;
    };
  }, [refresh]);
  useEffect(() => {
    const dispose = listenSessionChange((phase) => {
      changing.current = phase === "changing";
      revision.current++;
      if (phase === "changing") {
        setUser(null);
        setData(null);
      } else void refresh();
    });
    window.addEventListener("focus", refresh);
    return () => {
      dispose();
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);
  const userId = user ? `${user.id}:${user.tenant_id}` : null;
  useEffect(() => {
    if (!userId) return;
    let socket: WebSocket;
    let reconnect: ReturnType<typeof setTimeout>;
    let closed = false;
    let delay = 1000;
    let update: ReturnType<typeof setTimeout>;
    const connect = () => {
      const url = new URL("/api/ws", window.location.origin);
      url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
      socket = new WebSocket(url);
      socket.onopen = () => {
        setConnected(true);
        delay = 1000;
      };
      socket.onmessage = () => {
        clearTimeout(update);
        update = setTimeout(refresh, 200);
      };
      socket.onclose = () => {
        setConnected(false);
        if (!closed) {
          reconnect = setTimeout(connect, delay);
          delay = Math.min(delay * 2, 30000);
        }
      };
      socket.onerror = () => socket.close();
    };
    connect();
    return () => {
      closed = true;
      clearTimeout(reconnect);
      clearTimeout(update);
      socket?.close();
    };
  }, [userId, refresh]);
  return { user, data, error, connected, refresh };
}
