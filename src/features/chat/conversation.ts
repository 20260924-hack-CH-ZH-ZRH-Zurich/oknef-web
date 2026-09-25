import type { z } from "zod";
import type { chatSessionDetailSchema } from "@/features/product/contracts";
import type { ChatReply } from "@/lib/api";
import type { DocumentReply } from "./documents";
import type { WorkflowReply } from "./workflows";
export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  result?: ChatReply;
  document?: DocumentReply;
  workflow?: WorkflowReply;
  image?: string;
  imageModel?: string;
  error?: boolean;
  voice?: boolean;
};
export function boundedHistory(messages: readonly Message[]) {
  return messages
    .filter(
      (message) =>
        !message.error &&
        !message.image &&
        !message.workflow &&
        !message.document,
    )
    .slice(-12)
    .map(({ role, content }) => {
      const bytes = new TextEncoder().encode(content);
      if (bytes.length <= 6000) return { role, content };
      let end = 6000;
      // Keep a complete UTF-8 prefix within the core's byte limit.
      while (end > 0 && (bytes[end] & 0xc0) === 0x80) end--;
      return {
        role,
        content: new TextDecoder().decode(bytes.subarray(0, end)),
      };
    });
}
export function isImageRequest(text: string) {
  return /^\s*(?:\/image\b|(?:please\s+)?(?:generate|create|draw|make)\s+(?:me\s+)?(?:an?\s+)?(?:image|picture|illustration|diagram)\b|(?:genera|crea|dibuja)\s+(?:una?\s+)?(?:imagen|ilustración|diagrama)\b|(?:erzeuge|erstelle|zeichne)\s+(?:ein(?:e)?\s+)?(?:bild|diagramm|illustration)\b|(?:génère|crée|dessine)\s+(?:une?\s+)?(?:image|illustration|diagramme)\b)/i.test(
    text,
  );
}

export function restoreMessages(
  session: z.infer<typeof chatSessionDetailSchema>,
): Message[] {
  return session.messages.flatMap((entry): Message[] => {
    if ("role" in entry)
      return [
        {
          id: entry.id,
          role: entry.role,
          content: entry.content,
          voice: true,
        },
      ];
    return [
      { id: `${entry.id}-user`, role: "user", content: entry.message },
      {
        id: entry.id,
        role: "assistant",
        content: entry.answer,
        result: {
          answer: entry.answer,
          cards: entry.cards,
          model: entry.model,
          provider: entry.provider,
          request_id: entry.request_id,
          verification: entry.verification,
          session_id: session.id,
        },
      },
    ];
  });
}
