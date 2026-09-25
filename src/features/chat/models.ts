import { z } from "zod";

export const modelSchema = z
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
