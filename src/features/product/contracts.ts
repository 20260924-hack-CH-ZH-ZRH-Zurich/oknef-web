import { z } from "zod";
import { chatSchema, timestampSchema } from "@/lib/api";
export const integrationSchema = z
  .object({
    id: z.string(),
    provider: z.enum(["mail", "cloud-drive", "bank", "telecom", "custom"]),
    name: z.string(),
    account_label: z.string(),
    asset_ids: z.array(z.string()),
    status: z.literal("registered"),
    connection_verified: z.literal(false),
    background_sync: z.literal(false),
    credential_storage: z.literal(false),
    created_at: timestampSchema,
    created_by: z.string(),
    synthetic: z.boolean(),
  })
  .strict();
export const graphSchema = z
  .object({
    nodes: z.array(
      z
        .object({
          id: z.string(),
          kind: z.string(),
          label: z.string().nullable(),
          status: z.string().nullish(),
          created_at: timestampSchema.nullish(),
          synthetic: z.boolean(),
        })
        .strict(),
    ),
    edges: z.array(
      z
        .object({
          source: z.string(),
          target: z.string(),
          relation: z.string(),
          provenance: z.string(),
        })
        .strict(),
    ),
    generated_at: timestampSchema,
    scope: z.literal("current_workspace"),
    discovery: z.literal("stored_records_and_explicit_references"),
    physical_network_scan: z.literal(false),
  })
  .strict();
export type Graph = z.infer<typeof graphSchema>;
export const chatSessionSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    created_at: timestampSchema,
    created_by: z.string(),
    synthetic: z.boolean(),
  })
  .strict();
export const savedMessageSchema = chatSchema
  .omit({ session_id: true })
  .extend({
    id: z.string(),
    session_id: z.string(),
    message: z.string(),
    created_at: timestampSchema,
    created_by: z.string(),
    synthetic: z.boolean(),
  })
  .strict();
export const realtimeMessageSchema = z
  .object({
    id: z.string(),
    session_id: z.string(),
    role: z.enum(["user", "assistant"]),
    content: z.string(),
    source: z.literal("realtime_transcript"),
    provenance: z.literal("client_reported_realtime_transcript"),
    provider_attested: z.literal(false),
    created_at: timestampSchema,
    created_at_ms: z.number(),
    created_by: z.string(),
    synthetic: z.boolean(),
  })
  .strict();
export const chatSessionDetailSchema = chatSessionSchema
  .extend({
    messages: z.array(z.union([savedMessageSchema, realtimeMessageSchema])),
  })
  .strict();
export const voicePolicySchema = z
  .object({
    mode: z.enum(["authenticated_session", "trusted_only"]),
    speaker_verification_available: z.literal(false),
    deepfake_detection_available: z.literal(false),
    session_allowed: z.boolean(),
    authority: z.literal("signed_in_session"),
    effect: z.string(),
    updated_at: timestampSchema.optional(),
    id: z.string().optional(),
  })
  .strict();
