import { z } from "zod";

export function utf8String(maximum: number) {
  return z
    .string()
    .refine((value) => new TextEncoder().encode(value).length <= maximum, {
      message: `Must contain at most ${maximum} UTF-8 bytes`,
    });
}

export const timestampSchema = z
  .union([
    z.string().refine((value) => Number.isFinite(Date.parse(value))),
    z.number().int().nonnegative().max(253402300799),
  ])
  .transform((value) =>
    typeof value === "number" ? new Date(value * 1000).toISOString() : value,
  );

export const userSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    tenant_id: z.string(),
    account_type: z.enum(["personal", "family", "company"]),
    role: z.enum(["owner", "member", "reviewer"]),
    demo: z.boolean(),
    demo_profile: z.enum(["personal", "company", "admin"]).nullish(),
  })
  .strict();
export const assetSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    institution: z.string(),
    value: z.number(),
    currency: z.string(),
    notes: z.string(),
    beneficiary: z.string(),
    created_at: timestampSchema,
    updated_at: timestampSchema,
  })
  .strict();
export const planSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    beneficiary: z.string(),
    guardian_emails: z.array(z.string()),
    required_approvals: z.number(),
    waiting_days: z.number(),
    status: z.enum(["draft", "review_requested", "cancelled"]),
    created_at: timestampSchema,
    updated_at: timestampSchema,
  })
  .strict();
export const dashboardSchema = z
  .object({
    assets: z.array(assetSchema),
    asset_count: z.number(),
    total_value: z.number(),
    currency: z.string(),
    plans: z.array(planSchema),
    members: z.array(userSchema),
    account_type: z.enum(["personal", "family", "company"]),
    demo: z.boolean(),
    security: z
      .object({
        metadata_only: z.boolean(),
        passkeys: z.boolean(),
        post_quantum: z.boolean(),
        release_enabled: z.boolean(),
      })
      .strict(),
  })
  .strict();
export const cardSchema = z
  .object({
    type: z.enum([
      "checklist",
      "summary",
      "warning",
      "steps",
      "comparison",
      "asset",
    ]),
    title: utf8String(1000),
    body: utf8String(12000),
    items: z.array(utf8String(2000)).max(30),
    severity: z.enum(["info", "success", "warning", "critical"]),
  })
  .strict();
export const chatSchema = z
  .object({
    answer: utf8String(40000).min(1),
    cards: z.array(cardSchema).min(1).max(5),
    model: z.string(),
    provider: z.string(),
    request_id: z.string(),
    session_id: z.string().optional(),
    verification: z
      .object({
        status: z.literal("schema_validated"),
        human_review_required: z.literal(true),
        actions_executed: z.literal(false),
        source: z.literal("live_provider"),
      })
      .strict(),
  })
  .strict();
export const imageSchema = z
  .object({
    image_base64: z
      .string()
      .max(20000000)
      .regex(/^[A-Za-z0-9+/=]+$/),
    mime_type: z.enum(["image/png", "image/jpeg", "image/webp"]),
    model: z.string(),
    prompt: z.string(),
  })
  .strict();
export type User = z.infer<typeof userSchema>;
export type Asset = z.infer<typeof assetSchema>;
export type Plan = z.infer<typeof planSchema>;
export type Dashboard = z.infer<typeof dashboardSchema>;
export type GenerativeCard = z.infer<typeof cardSchema>;
export type ChatReply = z.infer<typeof chatSchema>;
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}

export async function api<T>(
  path: string,
  schema: z.ZodType<T>,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      ...(options.body && !(options.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...options.headers,
    },
  });
  if (!response.ok)
    throw new ApiError(
      response.status,
      response.status === 401
        ? "sessionExpired"
        : response.status === 503
          ? "serverUnavailable"
          : "error",
    );
  const parsed = schema.safeParse(await response.json());
  if (!parsed.success) throw new ApiError(502, "invalidResponse");
  return parsed.data;
}
export function mutation(method: string, value?: unknown): RequestInit {
  return {
    method,
    ...(value === undefined ? {} : { body: JSON.stringify(value) }),
  };
}
export function errorKey(error: unknown) {
  return error instanceof ApiError ? error.code : "networkError";
}
