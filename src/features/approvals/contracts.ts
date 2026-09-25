import { z } from "zod";
import { timestampSchema, userSchema, utf8String } from "@/lib/api";
export const policySchema = z
  .object({
    id: z.string(),
    title: z.string(),
    reviewer_ids: z.array(z.string()),
    required_approvals: z.number().int().min(2),
    created_at: timestampSchema,
    created_by: z.string(),
    execution_enabled: z.literal(false),
  })
  .strict();
export const approvalSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    policy_id: z.string(),
    reviewer_ids: z.array(z.string()),
    required_approvals: z.number().int().min(2),
    created_by: z.string(),
    created_at: timestampSchema,
    status: z.enum(["pending", "approved", "rejected"]),
    votes: z.array(
      z
        .object({
          id: z.string(),
          request_id: z.string(),
          reviewer_id: z.string(),
          reviewer_name: z.string(),
          decision: z.enum(["approve", "reject"]),
          created_at: timestampSchema,
        })
        .strict(),
    ),
    execution_enabled: z.literal(false),
    scope: z.literal("recorded_human_decision_only"),
  })
  .strict();
export const approvalsSchema = z
  .object({
    policies: z.array(policySchema),
    requests: z.array(approvalSchema),
    members: z.array(userSchema),
  })
  .strict();
export const invitationSchema = z
  .object({
    id: z.string(),
    email: z.string(),
    recipient_user_id: z.string().uuid(),
    role: z.enum(["member", "reviewer"]),
    tenant_id: z.string(),
    account_type: z.enum(["personal", "family", "company"]),
    workspace_name: z.string(),
    inviter_name: z.string(),
    status: z.enum(["pending", "accepted"]),
    created_at: timestampSchema,
    expires_at: timestampSchema,
    delivery: z.literal("in_app"),
    email_verified: z.literal(false),
    accepted_at: timestampSchema.optional(),
  })
  .strict();
export const invitationsSchema = z
  .object({
    incoming: z.array(invitationSchema.partial({ recipient_user_id: true })),
    outgoing: z.array(invitationSchema.partial({ recipient_user_id: true })),
  })
  .strict();
export const membershipSchema = userSchema
  .extend({
    workspace_name: z.string(),
    email_verified: z.literal(false),
    joined_at: timestampSchema,
  })
  .strict();
export const acceptSchema = z.object({ membership: membershipSchema }).strict();
export const workspaceSchema = z
  .object({
    tenant_id: z.string(),
    account_type: z.enum(["personal", "family", "company"]),
    name: z.string(),
    role: z.enum(["owner", "member", "reviewer"]),
  })
  .strict();
export const workspacesSchema = z
  .object({
    workspaces: z.array(workspaceSchema),
    current_tenant_id: z.string(),
  })
  .strict();
export const policyInputSchema = z
  .object({
    title: utf8String(160).min(1),
    reviewer_ids: z.array(z.string()).min(2).max(10),
    required_approvals: z.number().int().min(2).max(10),
  })
  .strict()
  .refine(
    (value) =>
      new Set(value.reviewer_ids).size === value.reviewer_ids.length &&
      value.required_approvals <= value.reviewer_ids.length,
  );
export const invitationInputSchema = z
  .object({
    email: z.email().max(254),
    recipient_user_id: z.uuid(),
    role: z.literal("reviewer"),
  })
  .strict();
export const requestInputSchema = z
  .object({
    policy_id: z.uuid(),
    title: utf8String(160).min(1),
    description: utf8String(4000).min(1),
  })
  .strict();
export type Approval = z.infer<typeof approvalSchema>;
export type Policy = z.infer<typeof policySchema>;
export type ApprovalsData = z.infer<typeof approvalsSchema>;
export type InvitationsData = z.infer<typeof invitationsSchema>;
