import { parseVoiceAction, type VoiceAction } from "./commands";

export type VoiceActivity = "listening" | "hearing" | "thinking" | "speaking";
export type VoiceMessage = { role: "user" | "assistant"; content: string };
export type VoiceActionResult = Record<string, unknown>;
export type VoiceActionHandler = (
  action: VoiceAction,
) => Promise<VoiceActionResult>;

type Channel = {
  readyState: RTCDataChannelState;
  send: (data: string) => void;
};
export function voiceEvents(
  channel: Channel,
  callbacks: {
    onText: (role: "user" | "assistant", text: string) => void;
    onAction?: VoiceActionHandler;
    onActivity?: (activity: VoiceActivity) => void;
    onReady: () => void;
    onError: () => void;
    signal: AbortSignal;
  },
) {
  const seen = new Set<string>();
  let active = false;
  let responsePending = false;
  let processing = Promise.resolve();
  const send = (value: unknown) => {
    if (callbacks.signal.aborted || channel.readyState !== "open") return false;
    channel.send(JSON.stringify(value));
    return true;
  };
  const requestResponse = () => {
    responsePending = true;
    if (!active && send({ type: "response.create" })) {
      responsePending = false;
      active = true;
    }
  };
  const remember = (id: string) => {
    if (seen.has(id)) return false;
    seen.add(id);
    if (seen.size > 2000) seen.delete(seen.values().next().value as string);
    return true;
  };
  async function tools(output: unknown[]) {
    let completed = false;
    for (const entry of output.slice(0, 8)) {
      if (!entry || typeof entry !== "object") continue;
      const call = entry as Record<string, unknown>;
      if (
        call.type !== "function_call" ||
        typeof call.call_id !== "string" ||
        !remember(`tool:${call.call_id}`)
      )
        continue;
      const action = parseVoiceAction(call.name, call.arguments);
      let result: VoiceActionResult = {
        completed: false,
        error: "unsupported_action",
      };
      if (action && callbacks.onAction && !callbacks.signal.aborted) {
        try {
          result = await callbacks.onAction(action);
        } catch {
          result = { completed: false, error: "action_failed" };
        }
      }
      completed =
        send({
          type: "conversation.item.create",
          item: {
            type: "function_call_output",
            call_id: call.call_id,
            output: JSON.stringify(result).slice(0, 12000),
          },
        }) || completed;
    }
    if (completed) requestResponse();
  }
  function receive(data: unknown) {
    if (
      callbacks.signal.aborted ||
      typeof data !== "string" ||
      data.length > 200000
    )
      return;
    let message: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(data);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
        return;
      message = parsed as Record<string, unknown>;
    } catch {
      return;
    }
    const type = message.type;
    if (type === "session.created") callbacks.onReady();
    if (
      type === "error" ||
      type === "conversation.item.input_audio_transcription.failed"
    ) {
      callbacks.onError();
      return;
    }
    if (type === "input_audio_buffer.speech_started")
      callbacks.onActivity?.("hearing");
    if (type === "input_audio_buffer.speech_stopped")
      callbacks.onActivity?.("thinking");
    if (type === "output_audio_buffer.started")
      callbacks.onActivity?.("speaking");
    if (
      type === "output_audio_buffer.stopped" ||
      type === "output_audio_buffer.cleared"
    )
      callbacks.onActivity?.("listening");
    if (type === "response.created") active = true;
    if (type === "response.done") {
      active = false;
      const response = message.response as Record<string, unknown> | undefined;
      if (response?.status === "failed" || response?.status === "incomplete")
        callbacks.onError();
      const output = Array.isArray(response?.output) ? response.output : [];
      processing = processing
        .then(() => tools(output))
        .catch(() => callbacks.onError());
      if (responsePending) requestResponse();
    }
    const user =
      type === "conversation.item.input_audio_transcription.completed";
    if (
      user ||
      type === "response.output_audio_transcript.done" ||
      type === "response.audio_transcript.done"
    ) {
      const transcript = message.transcript;
      const key = `${user ? "user" : "assistant"}:${message.item_id ?? message.response_id ?? message.event_id ?? transcript}:${message.content_index ?? 0}`;
      if (typeof transcript === "string" && transcript.trim() && remember(key))
        callbacks.onText(
          user ? "user" : "assistant",
          transcript.slice(0, 30000),
        );
    }
  }
  function addMessage(message: VoiceMessage) {
    return send({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: message.role,
        content: [
          {
            type: message.role === "user" ? "input_text" : "output_text",
            text: message.content,
          },
        ],
      },
    });
  }
  return {
    receive,
    restore: (history: readonly VoiceMessage[]) =>
      history.slice(-12).forEach(addMessage),
    sendText: (content: string) => {
      if (!content.trim() || content.length > 12000) return false;
      if (!addMessage({ role: "user", content })) return false;
      callbacks.onText("user", content);
      if (active) send({ type: "response.cancel" });
      requestResponse();
      return true;
    },
    addContext: (content: string) => addMessage({ role: "user", content }),
  };
}
