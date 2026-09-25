import { describe, expect, test } from "bun:test";
import { type VoiceActionHandler, voiceEvents } from "./voiceEvents";

function harness(onAction?: VoiceActionHandler) {
  const sent: Record<string, unknown>[] = [];
  const text: { role: string; text: string }[] = [];
  const activity: string[] = [];
  let errors = 0;
  let ready = false;
  const controller = new AbortController();
  const channel = {
    readyState: "open" as RTCDataChannelState,
    send: (value: string) => sent.push(JSON.parse(value)),
  };
  const events = voiceEvents(channel, {
    signal: controller.signal,
    onAction,
    onText: (role, value) => text.push({ role, text: value }),
    onActivity: (value) => activity.push(value),
    onReady: () => {
      ready = true;
    },
    onError: () => {
      errors++;
    },
  });
  return {
    events,
    sent,
    text,
    activity,
    controller,
    channel,
    receive: (value: unknown) => events.receive(JSON.stringify(value)),
    get errors() {
      return errors;
    },
    get ready() {
      return ready;
    },
  };
}
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("Realtime conversation events", () => {
  test("restores bounded role-preserving history without asking for a response", () => {
    const h = harness();
    h.events.restore(
      Array.from({ length: 14 }, (_, i) => ({
        role: i % 2 ? ("assistant" as const) : ("user" as const),
        content: `Turn ${i}`,
      })),
    );
    expect(h.sent).toHaveLength(12);
    expect(h.sent[0]).toEqual({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: "Turn 2" }],
      },
    });
    expect(h.sent[1]).toEqual({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "assistant",
        content: [{ type: "output_text", text: "Turn 3" }],
      },
    });
  });
  test("deduplicates transcripts and exposes actual activity and provider errors", () => {
    const h = harness();
    h.receive({ type: "session.created" });
    expect(h.ready).toBe(true);
    const input = {
      type: "conversation.item.input_audio_transcription.completed",
      item_id: "u1",
      transcript: "Open QR",
    };
    h.receive(input);
    h.receive(input);
    h.receive({
      type: "response.output_audio_transcript.done",
      item_id: "a1",
      transcript: "Opening QR",
    });
    h.receive({
      type: "response.audio_transcript.done",
      item_id: "a1",
      transcript: "Opening QR",
    });
    expect(h.text).toHaveLength(2);
    for (const type of [
      "input_audio_buffer.speech_started",
      "input_audio_buffer.speech_stopped",
      "output_audio_buffer.started",
      "output_audio_buffer.stopped",
    ])
      h.receive({ type });
    expect(h.activity).toEqual([
      "hearing",
      "thinking",
      "speaking",
      "listening",
    ]);
    h.receive({
      type: "error",
      error: { message: "private provider diagnostic" },
    });
    h.receive({ type: "conversation.item.input_audio_transcription.failed" });
    expect(h.errors).toBe(2);
    expect(JSON.stringify(h.sent)).not.toContain("private");
  });
  test("keeps delayed user transcription before the assistant response and typed followup", () => {
    const h = harness();
    h.receive({ type: "input_audio_buffer.committed", item_id: "u1" });
    h.receive({
      type: "response.output_audio_transcript.done",
      item_id: "a1",
      transcript: "Opening QR",
    });
    expect(h.text).toHaveLength(0);
    h.events.sendText("Please check the result");
    expect(h.text).toHaveLength(0);
    h.receive({
      type: "conversation.item.input_audio_transcription.completed",
      item_id: "u1",
      transcript: "Open QR",
    });
    expect(h.text).toEqual([
      { role: "user", text: "Open QR" },
      { role: "assistant", text: "Opening QR" },
      { role: "user", text: "Please check the result" },
    ]);
    h.receive({ type: "input_audio_buffer.committed", item_id: "empty" });
    h.receive({
      type: "response.output_audio_transcript.done",
      item_id: "a2",
      transcript: "Ready",
    });
    h.receive({
      type: "conversation.item.input_audio_transcription.completed",
      item_id: "empty",
      transcript: "",
    });
    expect(h.text.at(-1)).toEqual({ role: "assistant", text: "Ready" });
  });
  test("waits for complete response and successful async action before acknowledgement", async () => {
    let resolve!: (value: Record<string, unknown>) => void;
    let runs = 0;
    const h = harness(async () => {
      runs++;
      return new Promise((done) => {
        resolve = done;
      });
    });
    const call = {
      type: "function_call",
      call_id: "c1",
      name: "open_miniapp",
      arguments: '{"kind":"qr"}',
    };
    h.receive({ type: "response.created" });
    h.receive({ ...call, type: "response.function_call_arguments.done" });
    expect(runs).toBe(0);
    h.receive({
      type: "response.done",
      response: { status: "completed", output: [call] },
    });
    await tick();
    expect(runs).toBe(1);
    expect(h.sent).toHaveLength(0);
    resolve({ opened: true, submitted: false });
    await tick();
    expect(h.sent.map((event) => event.type)).toEqual([
      "conversation.item.create",
      "response.create",
    ]);
    expect(JSON.stringify(h.sent[0])).toContain("opened");
    h.receive({
      type: "response.done",
      response: { status: "completed", output: [call] },
    });
    await tick();
    expect(runs).toBe(1);
    expect(h.sent).toHaveLength(2);
  });
  test("does not acknowledge unsupported tools or a cancelled async action as completed", async () => {
    const h = harness(async () => ({ completed: true }));
    h.receive({
      type: "response.done",
      response: {
        output: [
          {
            type: "function_call",
            call_id: "bad",
            name: "release_assets",
            arguments: "{}",
          },
        ],
      },
    });
    await tick();
    expect(JSON.stringify(h.sent[0])).toContain("unsupported_action");
    h.controller.abort();
    h.receive({
      type: "response.done",
      response: {
        output: [
          {
            type: "function_call",
            call_id: "late",
            name: "open_miniapp",
            arguments: '{"kind":"qr"}',
          },
        ],
      },
    });
    await tick();
    expect(h.sent).toHaveLength(2);
    expect(h.events.sendText("late user text")).toBe(false);
  });
  test("typed text interrupts only active responses and queues one continuation", () => {
    const h = harness();
    h.receive({ type: "response.created" });
    expect(h.events.sendText("Continue with my existing assets")).toBe(true);
    expect(h.sent.map((event) => event.type)).toEqual([
      "conversation.item.create",
      "response.cancel",
    ]);
    h.receive({
      type: "response.done",
      response: { status: "cancelled", output: [] },
    });
    expect(h.sent.map((event) => event.type)).toEqual([
      "conversation.item.create",
      "response.cancel",
      "response.create",
    ]);
    expect(h.text).toEqual([
      { role: "user", text: "Continue with my existing assets" },
    ]);
    h.channel.readyState = "closed";
    expect(h.events.sendText("lost input")).toBe(false);
    expect(h.text).toHaveLength(1);
  });
});
