import { z } from "zod";
import { evidenceSchema } from "@/features/evidence/localStore";
import { timestampSchema, utf8String } from "@/lib/api";

export const sessionKindSchema = z.enum([
  "link",
  "qr",
  "email",
  "call",
  "document",
  "video",
  "identity",
]);
const signalSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    severity: z.enum(["low", "medium", "high"]),
    evidence: z.string(),
    provenance: z.literal("deterministic_rule"),
  })
  .strict();
const storedEvidenceSchema = z.discriminatedUnion("provenance", [
  evidenceSchema
    .extend({
      id: z.string(),
      provenance: z.literal("client_reported_metadata"),
      bytes_retained: z.literal(false),
      digest_verified: z.literal(false),
    })
    .strict(),
  evidenceSchema
    .extend({
      id: z.string(),
      provenance: z.literal("server_received_upload"),
      bytes_retained: z.literal(false),
      digest_verified: z.literal(true),
      received_at: z.number().int().nonnegative(),
      source_verified: z.literal(false),
      content_provenance: z.literal("user_reviewed_extraction"),
    })
    .strict(),
]);
export const sessionSchema = z
  .object({
    id: z.string(),
    kind: sessionKindSchema,
    title: z.string(),
    content: z.string(),
    reference_text: z.string().nullable().optional(),
    evidence: z.array(storedEvidenceSchema).optional(),
    asset_ids: z.array(z.string()).optional(),
    parent_session_id: z.string().nullable().optional(),
    created_at: timestampSchema,
    updated_at: timestampSchema,
    created_by: z.string(),
    synthetic: z.boolean(),
    assessment: z
      .object({
        status: z.enum(["review_required", "no_signals", "inconclusive"]),
        signals: z.array(signalSchema),
        method: z.literal("deterministic_rules_v1"),
        calibrated: z.literal(false),
        authenticity_verified: z.literal(false),
        summary: z.string(),
        limitations: z.array(z.string()),
        mode: z.enum(["standard", "active", "paranoid"]),
        independent_verification_required: z.boolean(),
      })
      .strict(),
    questions: z.array(
      z
        .object({
          id: z.string(),
          session_id: z.string(),
          synthetic: z.boolean(),
          question: z.string(),
          answer: z.string(),
          created_at: timestampSchema,
          provenance: z.enum([
            "stored_evidence_rules",
            "live_provider_evidence_advisor",
          ]),
          model: z.string().optional(),
          verification: z
            .object({
              status: z.literal("schema_validated"),
              human_review_required: z.literal(true),
              actions_executed: z.literal(false),
              source: z.literal("live_provider"),
            })
            .strict()
            .optional(),
        })
        .strict(),
    ),
  })
  .strict();
export const eventSchema = z
  .object({
    id: z.string(),
    session_id: z.string(),
    type: z.enum([
      "security.review_required",
      "security.session_checked",
      "security.simulation",
    ]),
    severity: z.string(),
    synthetic: z.boolean(),
    created_at: timestampSchema,
    title: z.string(),
  })
  .strict();
export const settingsSchema = z
  .object({
    mode: z.enum(["standard", "active", "paranoid"]),
    updated_at: timestampSchema.nullable(),
    scope: z.literal("in_app_checks"),
    effect: z.string().optional(),
    device_protection: z.literal(false).optional(),
    background_monitoring: z.literal(false).optional(),
  })
  .strict();
export const securityOverviewSchema = z
  .object({
    sessions: z.array(sessionSchema),
    events: z.array(eventSchema),
    trends: z
      .array(
        z
          .object({
            day_start: z.number().int().nonnegative().max(253402300799),
            checks: z.number().int().nonnegative(),
            flagged: z.number().int().nonnegative(),
          })
          .strict()
          .refine((point) => point.flagged <= point.checks),
      )
      .length(30),
    compliance: z
      .object({
        status: z.literal("not_assessed"),
        certified: z.literal(false),
        coverage_percent: z.number().min(0).max(100),
        evidence_count: z.number().int().nonnegative(),
        frameworks: z.array(z.string()),
        measurement: z.string(),
        limitations: z.string(),
        controls: z.array(
          z
            .object({
              id: z.string(),
              label: z.string(),
              evidence_count: z.number().int().nonnegative(),
              status: z.string(),
            })
            .strict(),
        ),
      })
      .strict(),
    attack_vectors: z.array(
      z
        .object({
          id: z.string(),
          title: z.string(),
          channel: z.string(),
          impact: z.string(),
          mitigation: z.string(),
          validation: z.string(),
          status: z.string(),
        })
        .strict(),
    ),
    settings: settingsSchema,
    capabilities: z
      .object({
        deepfake_detection: z.literal(false),
        mailbox_monitoring: z.literal(false),
        call_interception: z.literal(false),
        url_reputation: z.literal(false),
        document_authentication: z.literal(false),
        evidence_persistence: z.literal(true),
        in_app_alerts: z.literal(true),
      })
      .strict(),
  })
  .strict();
export const sessionInputSchema = z
  .object({
    kind: sessionKindSchema,
    title: utf8String(160).min(1),
    content: utf8String(20000).min(1),
    reference_text: utf8String(10000).optional(),
    evidence: z.array(evidenceSchema).max(8).optional(),
    asset_ids: z.array(z.string().uuid()).max(20).optional(),
    parent_session_id: z.string().uuid().optional(),
  })
  .strict();
export type SecuritySession = z.infer<typeof sessionSchema>;
export type SecurityOverview = z.infer<typeof securityOverviewSchema>;
export type SecurityEvent = z.infer<typeof eventSchema>;
export type SessionKind = z.infer<typeof sessionKindSchema>;
