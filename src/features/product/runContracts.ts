import { z } from "zod";
import { workflowSchema } from "@/features/chat/workflows";
import { timestampSchema } from "@/lib/api";

const pendingRun = z
  .object({
    id: z.string(),
    workflow: workflowSchema.shape.workflow,
    locale: z.enum(["en", "es", "de", "fr"]),
    status: z.literal("pending"),
    run_state: z.literal("pending"),
    created_at: timestampSchema,
    started_at: timestampSchema,
    updated_at: timestampSchema,
    completed_at: z.null(),
    created_by: z.string(),
    synthetic: z.boolean(),
    input_sha256: z.string().regex(/^[a-f0-9]{64}$/),
    executed_actions: z.array(z.never()).length(0),
    provider: z.literal("openclaw-via-rust-core"),
  })
  .strict();
const failedRun = pendingRun
  .extend({
    status: z.literal("failed"),
    run_state: z.literal("failed"),
    completed_at: timestampSchema,
    error_code: z.enum([
      "workflow_rejected",
      "workflow_gateway_authentication",
      "workflow_capacity",
      "workflow_provider_unavailable",
      "workflow_timeout",
      "workflow_gateway_unavailable",
      "workflow_invalid_response",
    ]),
    upstream_status: z.number().int().min(100).max(599).nullable(),
  })
  .strict();
export const workflowRunSchema = z.union([
  workflowSchema,
  pendingRun,
  failedRun,
]);
export type WorkflowRun = z.infer<typeof workflowRunSchema>;
