import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/features/preferences/Preferences";
import {
  chatSessionDetailSchema,
  chatSessionSchema,
  realtimeMessageSchema,
} from "@/features/product/contracts";
import { api, chatSchema, imageSchema, mutation } from "@/lib/api";
import { boundedHistory, type Message, restoreMessages } from "./conversation";
import { documentSchema, documentText } from "./documents";
import { chatMessageTooLong } from "./limits";
import { type Workflow, workflowSchema } from "./workflows";

export function useConversation(locale: Locale, initialSessionId?: string) {
  const [sessionId, setSessionId] = useState<string | undefined>(
    initialSessionId,
  );
  const sessionRef = useRef(initialSessionId);
  const sessionGeneration = useRef(0);
  const lifetime = useRef(new AbortController());
  const sessionRequest = useRef<Promise<string> | null>(null);
  const voiceWrites = useRef<Promise<unknown>>(Promise.resolve());
  const [historyError, setHistoryError] = useState(false);
  const restoring = useRef<Promise<unknown>>(Promise.resolve());
  const restoreFailed = useRef(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState<
    "chat" | "image" | "review" | "document" | null
  >(null);
  const controller = useRef<AbortController | null>(null);
  const history = useRef<Message[]>([]);
  useEffect(() => {
    if (lifetime.current.signal.aborted)
      lifetime.current = new AbortController();
    return () => {
      lifetime.current.abort();
      controller.current?.abort();
    };
  }, []);
  const append = useCallback((message: Message) => {
    history.current = [...history.current, message];
    setMessages(history.current);
  }, []);
  useEffect(() => {
    if (!initialSessionId) return;
    restoreFailed.current = false;
    const request = new AbortController();
    const signal = AbortSignal.any([request.signal, lifetime.current.signal]);
    restoring.current = api(
      `/chat/sessions/${encodeURIComponent(initialSessionId)}`,
      chatSessionDetailSchema,
      { signal },
    )
      .then((session) => {
        if (signal.aborted) return;
        const restored = restoreMessages(session);
        history.current = restored;
        setMessages(restored);
        setSessionId(session.id);
        sessionRef.current = session.id;
      })
      .catch(() => {
        if (!signal.aborted) restoreFailed.current = true;
        if (!signal.aborted)
          append({
            id: crypto.randomUUID(),
            role: "assistant",
            content: "error",
            error: true,
          });
      });
    return () => request.abort();
  }, [initialSessionId, append]);
  const ensureSession = useCallback(async () => {
    if (sessionRef.current) return sessionRef.current;
    if (sessionRequest.current) return sessionRequest.current;
    const generation = sessionGeneration.current;
    const signal = lifetime.current.signal;
    signal.throwIfAborted();
    const request = api("/chat/sessions", chatSessionSchema, {
      ...mutation("POST", { title: "Oknef conversation" }),
      signal,
    }).then((session) => {
      if (!signal.aborted && sessionGeneration.current === generation) {
        sessionRef.current = session.id;
        setSessionId(session.id);
      }
      return session.id;
    });
    sessionRequest.current = request;
    try {
      return await request;
    } finally {
      if (sessionRequest.current === request) sessionRequest.current = null;
    }
  }, []);
  async function send(
    content: string,
    model: string,
    image: boolean,
    workflow: Workflow | null = null,
  ) {
    if (
      !content.trim() ||
      controller.current ||
      (!image && !workflow && chatMessageTooLong(content)) ||
      (workflow && content.length > 5000)
    )
      return;
    const before = boundedHistory(history.current);
    const request = new AbortController();
    controller.current = request;
    append({ id: crypto.randomUUID(), role: "user", content });
    setPending(workflow ? "review" : image ? "image" : "chat");
    try {
      if (workflow) {
        const result = await api("/workflows", workflowSchema, {
          ...mutation("POST", { message: content, locale, workflow }),
          signal: request.signal,
        });
        if (!request.signal.aborted)
          append({
            id: crypto.randomUUID(),
            role: "assistant",
            content: "",
            workflow: result,
          });
      } else if (image) {
        const result = await api("/chat/image", imageSchema, {
          ...mutation("POST", {
            prompt: content.replace(/^\/image\s*/i, ""),
            locale,
          }),
          signal: request.signal,
        });
        if (!request.signal.aborted)
          append({
            id: crypto.randomUUID(),
            role: "assistant",
            content: "",
            image: `data:${result.mime_type};base64,${result.image_base64}`,
            imageModel: result.model,
          });
      } else {
        const id = await ensureSession();
        request.signal.throwIfAborted();
        const result = await api("/chat", chatSchema, {
          ...mutation("POST", {
            message: content,
            model,
            locale,
            history: before,
            session_id: id,
          }),
          signal: request.signal,
        });
        if (!request.signal.aborted && result.session_id) {
          setSessionId(result.session_id);
          sessionRef.current = result.session_id;
        }
        if (!request.signal.aborted)
          append({
            id: crypto.randomUUID(),
            role: "assistant",
            content: result.answer,
            result,
          });
      }
    } catch {
      if (!request.signal.aborted)
        append({
          id: crypto.randomUUID(),
          role: "assistant",
          content: "providerError",
          error: true,
        });
    } finally {
      if (controller.current === request) {
        controller.current = null;
        setPending(null);
      }
    }
  }
  async function extract(image_data_url: string, prompt: string) {
    if (controller.current) return;
    const request = new AbortController();
    controller.current = request;
    append({
      id: crypto.randomUUID(),
      role: "user",
      content: documentText[locale].title,
    });
    setPending("document");
    try {
      const result = await api("/ocr", documentSchema, {
        ...mutation("POST", { image_data_url, prompt, locale }),
        signal: request.signal,
      });
      if (!request.signal.aborted)
        append({
          id: crypto.randomUUID(),
          role: "assistant",
          content: "",
          document: result,
        });
    } catch {
      if (!request.signal.aborted)
        append({
          id: crypto.randomUUID(),
          role: "assistant",
          content: "providerError",
          error: true,
        });
    } finally {
      if (controller.current === request) {
        controller.current = null;
        setPending(null);
      }
    }
  }
  function stop() {
    controller.current?.abort();
    controller.current = null;
    setPending(null);
  }
  function clear() {
    stop();
    history.current = [];
    setMessages([]);
    setSessionId(undefined);
    sessionRef.current = undefined;
    sessionGeneration.current++;
    lifetime.current.abort();
    lifetime.current = new AbortController();
    sessionRequest.current = null;
    setHistoryError(false);
    restoreFailed.current = false;
  }
  function addVoice(role: "user" | "assistant", content: string) {
    const signal = lifetime.current.signal;
    if (signal.aborted) return;
    append({ id: crypto.randomUUID(), role, content, voice: true });
    const target = ensureSession().then(
      (id) => ({ id }),
      (error: unknown) => ({ error }),
    );
    voiceWrites.current = voiceWrites.current
      .catch(() => undefined)
      .then(async () => {
        signal.throwIfAborted();
        const ticket = await target;
        if (!("id" in ticket)) throw ticket.error;
        signal.throwIfAborted();
        const id = ticket.id;
        const bounded = new TextDecoder().decode(
          new TextEncoder().encode(content).slice(0, 11500),
        );
        await api(
          `/chat/sessions/${encodeURIComponent(id)}/messages`,
          realtimeMessageSchema,
          {
            ...mutation("POST", {
              role,
              content: bounded,
              source: "realtime_transcript",
            }),
            signal,
          },
        );
      })
      .catch(() => {
        if (!signal.aborted) setHistoryError(true);
      });
  }
  return {
    messages,
    pending,
    send,
    extract,
    stop,
    clear,
    addVoice,
    sessionId,
    ensureSession,
    historyError,
    prepareVoice: async () => {
      await restoring.current;
      if (restoreFailed.current) throw new Error("Session history unavailable");
      await ensureSession();
      return boundedHistory(history.current);
    },
    addWorkflow: (result: import("./workflows").WorkflowReply) =>
      append({
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        workflow: result,
      }),
  };
}
