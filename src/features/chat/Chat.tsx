"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { usePreferences } from "@/features/preferences/Preferences";
import { useProductMessages } from "@/features/product/messages";
import {
  type SecuritySession,
  type SessionKind,
  sessionKindSchema,
} from "@/features/security/contracts";
import { SessionDetail } from "@/features/security/SessionDetail";
import { SessionForm } from "@/features/security/SessionForm";
import { api } from "@/lib/api";
import { resetConversation } from "@/lib/mediaLifecycle";
import {
  ChatCommands,
  ChatHeader,
  ChatWelcome,
  VoiceStatus,
} from "./ChatChrome";
import { ChatMessages } from "./ChatMessages";
import { Composer } from "./Composer";
import { parseCommand, type VoiceAction } from "./commands";
import { withContext } from "./context";
import { chatMessageTooLong } from "./limits";
import { isImageRequest, useConversation } from "./useConversation";
import { useMedia } from "./useMedia";
import { VoicePolicy } from "./VoicePolicy";

import { type Workflow, workflowSchema } from "./workflows";

const modelSchema = z
  .object({
    models: z.array(
      z
        .object({
          id: z.string(),
          label: z.string(),
          capability: z.literal("chat"),
        })
        .strict(),
    ),
    image_model: z.string(),
    realtime_model: z.string(),
    transcription_model: z.string(),
    provider: z.string(),
    availability: z.string(),
  })
  .strict();
export function Chat({
  initialSessionId,
  contextView,
  active = true,
}: {
  initialSessionId?: string;
  contextView?: string;
  active?: boolean;
} = {}) {
  const { t, locale } = usePreferences();
  const conversation = useConversation(locale, initialSessionId);
  const product = useProductMessages();
  const router = useRouter();
  const [inlineApp, setInlineApp] = useState<SessionKind | null>(null);
  const [inlineResult, setInlineResult] = useState<SecuritySession | null>(
    null,
  );
  const [preparing, setPreparing] = useState(false);
  const operations = useRef(new AbortController());
  useEffect(() => {
    if (operations.current.signal.aborted)
      operations.current = new AbortController();
    return () => operations.current.abort();
  }, []);
  const [commandError, setCommandError] = useState(false);
  const ensureSession = conversation.ensureSession;
  const openMiniApp = useCallback(
    async (kind: SessionKind) => {
      const signal = operations.current.signal;
      setPreparing(true);
      setCommandError(false);
      try {
        await ensureSession();
        if (signal.aborted) return;
        setInlineApp(kind);
        setInlineResult(null);
      } catch {
        if (!signal.aborted) setCommandError(true);
      } finally {
        if (!signal.aborted) setPreparing(false);
      }
    },
    [ensureSession],
  );
  function voiceAction(action: VoiceAction) {
    if (action.name === "open_miniapp") void openMiniApp(action.arguments.kind);
    else {
      const aliases: Record<string, string> = {
        topology: "connections",
        assets: "vault",
        legacy: "succession",
      };
      router.push(
        `/${locale}/workspace?view=${aliases[action.arguments.view] || action.arguments.view}`,
      );
    }
  }
  const [input, setInput] = useState("");
  const [model, setModel] = useState("auto");
  const [models, setModels] = useState<string[]>([]);
  const [imageMode, setImageMode] = useState(false);
  const params = useSearchParams();
  const requestedWorkflow = workflowSchema.shape.workflow.safeParse(
    params.get("workflow"),
  );
  const [workflow, setWorkflow] = useState<Workflow | null>(
    requestedWorkflow.success ? requestedWorkflow.data : null,
  );
  const inputTooLong =
    !workflow &&
    !imageMode &&
    !isImageRequest(input) &&
    chatMessageTooLong(input.trim());
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const media = useMedia(
    locale,
    conversation.addVoice,
    (text) =>
      setInput((previous) => `${previous}${previous ? " " : ""}${text}`),
    voiceAction,
  );
  useEffect(() => {
    api("/models", modelSchema)
      .then((value) => setModels(value.models.map((item) => item.id)))
      .catch(() => setModels([]));
  }, []);
  const requestedApp = params.get("app");
  const openedApp = useRef<string | null>(null);
  useEffect(() => {
    const requested = sessionKindSchema.safeParse(requestedApp);
    if (requested.success && openedApp.current !== requested.data) {
      openedApp.current = requested.data;
      void openMiniApp(requested.data);
    }
  }, [requestedApp, openMiniApp]);
  useEffect(() => {
    if (!active) media.endVoice();
  }, [active, media.endVoice]);
  function reset() {
    operations.current.abort();
    operations.current = new AbortController();
    setPreparing(false);
    setCommandError(false);
    resetConversation(conversation.clear, () => {
      setInlineApp(null);
      setInlineResult(null);
      setInput("");
      setImageMode(false);
      setWorkflow(null);
    });
  }
  async function send() {
    if (
      !input.trim() ||
      inputTooLong ||
      conversation.pending ||
      preparing ||
      (workflow && input.length > 5000)
    )
      return;
    const command = parseCommand(input);
    if (command.type === "new") {
      reset();
      return;
    }
    if (command.type === "miniapp") {
      const signal = operations.current.signal;
      await openMiniApp(command.kind);
      if (!signal.aborted) setInput("");
      return;
    }
    const signal = operations.current.signal;
    let content = command.content;
    setPreparing(true);
    setCommandError(false);
    try {
      content = await withContext(content, contextView, signal);
      if (signal.aborted) return;
    } catch {
      if (signal.aborted) return;
      setCommandError(true);
      setPreparing(false);
      return;
    }
    setPreparing(false);
    conversation.send(
      content,
      model,
      imageMode || isImageRequest(input),
      workflow,
    );
    setInput("");
    setImageMode(false);
  }
  function choose(prompt: string, image = false) {
    setInput(prompt);
    setImageMode(image);
    setWorkflow(null);
    inputRef.current?.focus();
  }
  return (
    <section className="mx-auto flex min-h-[calc(100dvh-12rem)] max-w-3xl flex-col">
      <ChatHeader media={media} onNew={reset} />
      <ChatCommands
        onChoose={(command) =>
          setInput((previous) => `${previous}${previous ? " " : ""}${command} `)
        }
      />
      {(commandError || conversation.historyError) && (
        <p role="alert" className="my-3 text-sm text-danger">
          {product.error}
        </p>
      )}
      {preparing && <output className="my-3 text-xs">{product.pending}</output>}
      {inlineApp && active && (
        <div className="my-4">
          <SessionForm
            key={inlineApp}
            inline
            kind={inlineApp}
            parentSessionId={conversation.sessionId}
            onClose={() => setInlineApp(null)}
            onSaved={(value) => {
              setInlineResult(value);
              setInlineApp(null);
            }}
          />
        </div>
      )}
      {inlineResult && (
        <div className="my-4">
          <SessionDetail
            session={inlineResult}
            onUpdated={setInlineResult}
            onBack={() => setInlineResult(null)}
          />
        </div>
      )}
      {conversation.messages.length === 0 && !inlineApp && !inlineResult ? (
        <ChatWelcome onChoose={choose} />
      ) : (
        <ChatMessages
          messages={conversation.messages}
          pending={conversation.pending}
        />
      )}
      <VoiceStatus media={media} />
      {media.error && (
        <p
          role="alert"
          className="mb-3 rounded-xl bg-danger-soft p-3 text-sm text-danger"
        >
          {t(media.error)}
        </p>
      )}
      <VoicePolicy onBlocked={media.endVoice} />
      <Composer
        extract={conversation.extract}
        input={input}
        inputTooLong={inputTooLong}
        setInput={setInput}
        imageMode={imageMode}
        setImageMode={(enabled) => {
          setImageMode(enabled);
          if (enabled) setWorkflow(null);
        }}
        workflow={workflow}
        setWorkflow={(value) => {
          setWorkflow(value);
          if (value) setImageMode(false);
        }}
        model={model}
        setModel={setModel}
        models={models}
        inputRef={inputRef}
        pending={conversation.pending}
        send={send}
        stop={conversation.stop}
        recording={media.recording}
        transcribing={media.transcribing}
        voiceState={media.voiceState}
        toggleRecording={media.toggleRecording}
      />
    </section>
  );
}
