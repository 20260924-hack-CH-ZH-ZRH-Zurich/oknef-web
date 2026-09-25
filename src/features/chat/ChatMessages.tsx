import {
  AudioLines,
  ChevronDown,
  Download,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { GeneratedCards } from "@/components/ui/data-display/GeneratedCards/GeneratedCards";
import { usePreferences } from "@/features/preferences/Preferences";
import { DocumentResult } from "./DocumentResult";
import { documentText } from "./documents";
import type { Message } from "./useConversation";
import { WorkflowResult } from "./WorkflowResult";
import { workflowText } from "./workflows";
export function ChatMessages({
  messages,
  pending,
}: {
  messages: Message[];
  pending: "chat" | "image" | "review" | "document" | null;
}) {
  const { t, locale } = usePreferences();
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (messages.length === 0 && !pending) return;
    bottom.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, pending]);
  return (
    <div
      className="space-y-7 py-8"
      aria-live="polite"
      aria-relevant="additions"
    >
      {messages.map((message) => (
        <article
          key={message.id}
          className={message.role === "user" ? "ml-auto max-w-[85%]" : "w-full"}
        >
          {message.role === "user" ? (
            <p className="rounded-3xl rounded-br-lg bg-muted px-5 py-4 text-sm leading-7">
              {message.content}
            </p>
          ) : (
            <>
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold">
                <span className="flex size-7 items-center justify-center rounded-lg bg-accent/25 text-good">
                  <Sparkles size={14} />
                </span>
                {t("assistantName")}
                {message.voice && (
                  <AudioLines size={12} className="text-secondary" />
                )}
              </div>
              {message.error ? (
                <p
                  role="alert"
                  className="rounded-2xl bg-danger-soft p-4 text-sm leading-6 text-danger"
                >
                  {t("providerError")}
                </p>
              ) : (
                <>
                  <div className="whitespace-pre-wrap text-sm leading-7">
                    {message.content}
                  </div>
                  {message.document && (
                    <DocumentResult result={message.document} />
                  )}
                  {message.workflow && (
                    <WorkflowResult result={message.workflow} />
                  )}
                  {message.result && (
                    <GeneratedCards cards={message.result.cards} />
                  )}{" "}
                  {message.image && (
                    <figure className="my-4 overflow-hidden rounded-2xl border border-border bg-surface">
                      {/* biome-ignore lint/performance/noImgElement: validated data URLs are generated in memory and must not pass through an image proxy. */}
                      <img
                        src={message.image}
                        alt={t("generatedImage")}
                        className="h-auto w-full"
                      />
                      <figcaption className="flex items-center justify-between gap-4 p-4">
                        <p className="text-xs leading-5 text-secondary">
                          {t("imageDisclosure")}
                          <span className="mt-1 block">
                            {message.imageModel}
                          </span>
                        </p>
                        <a
                          href={message.image}
                          download="oknef-visual.png"
                          aria-label={t("imageDownload")}
                          title={t("imageDownload")}
                          className="icon-button shrink-0"
                        >
                          <Download size={16} />
                        </a>
                      </figcaption>
                    </figure>
                  )}
                  {message.result && (
                    <details className="mt-4 text-xs text-secondary">
                      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5">
                        <ShieldCheck size={12} />
                        {t("responseDetails")}
                        <ChevronDown size={12} />
                      </summary>
                      <dl className="mt-3 grid gap-2 rounded-xl bg-muted p-3">
                        <div>
                          <dt className="inline font-semibold">
                            {t("provider")}:{" "}
                          </dt>
                          <dd className="inline">{message.result.provider}</dd>
                        </div>
                        <div>
                          <dt className="inline font-semibold">
                            {t("modelUsed")}:{" "}
                          </dt>
                          <dd className="inline">{message.result.model}</dd>
                        </div>
                        <div>
                          <dt className="inline font-semibold">
                            {t("requestId")}:{" "}
                          </dt>
                          <dd className="inline break-all">
                            {message.result.request_id}
                          </dd>
                        </div>
                        <div>
                          <dt className="inline font-semibold">
                            {t("verification")}:{" "}
                          </dt>
                          <dd className="inline break-all">
                            {typeof message.result.verification === "string"
                              ? message.result.verification
                              : JSON.stringify(message.result.verification)}
                          </dd>
                        </div>
                      </dl>
                    </details>
                  )}
                </>
              )}
            </>
          )}
        </article>
      ))}
      {pending && (
        <output className="flex items-center gap-3 text-sm text-secondary">
          <Sparkles size={17} className="animate-pulse text-good" />
          {pending === "document"
            ? documentText[locale].working
            : pending === "review"
              ? workflowText[locale].working
              : t(pending === "image" ? "imageWorking" : "thinking")}
        </output>
      )}
      <div ref={bottom} />
    </div>
  );
}
