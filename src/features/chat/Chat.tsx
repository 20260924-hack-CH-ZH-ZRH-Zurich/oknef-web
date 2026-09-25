"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { parseCommand } from "./commands";
import { withContext } from "./context";
import { isImageRequest } from "./conversation";
import { chatMessageTooLong } from "./limits";
import { modelSchema } from "./models";
import { useConversation } from "./useConversation";
import { useMedia } from "./useMedia";
import { VoicePolicy } from "./VoicePolicy";
import { executeVoiceAction, miniAppVoiceContext } from "./voiceActions";

import { type Workflow, workflowSchema } from "./workflows";

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
  const [voiceAllowed, setVoiceAllowed] = useState(false);
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
        return true;
      } catch {
        if (!signal.aborted) setCommandError(true);
      } finally {
        if (!signal.aborted) setPreparing(false);
      }
    },
    [ensureSession],
  );
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
    (action) =>
      executeVoiceAction(action, {
        locale,
        currentView: contextView,
        signal: operations.current.signal,
        openMiniApp,
        onWorkflow: conversation.addWorkflow,
        navigate: router.push,
      }),
    conversation.prepareVoice,
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
      media.voiceState === "connecting" ||
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
    if (
      media.voiceState === "live" &&
      !workflow &&
      !imageMode &&
      !isImageRequest(input)
    ) {
      if (!media.sendText(content)) {
        setCommandError(true);
        return;
      }
      setInput("");
      return;
    }
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
      <ChatHeader media={media} onNew={reset} voiceAllowed={voiceAllowed} />
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
              media.addContext(miniAppVoiceContext(value));
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
      <VoicePolicy onBlocked={media.endVoice} onAllowed={setVoiceAllowed} />
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
