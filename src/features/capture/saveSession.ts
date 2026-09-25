import { z } from "zod";
import { type Evidence, retainEvidence } from "@/features/evidence/localStore";
import {
  type sessionInputSchema,
  sessionSchema,
} from "@/features/security/contracts";
import { api, mutation, userSchema } from "@/lib/api";
import { captureSubmission } from "./sessionCapture";

export type CapturedOriginal = { file: File; metadata: Evidence };

export async function saveEvidenceSession(
  input: z.infer<typeof sessionInputSchema>,
  original: CapturedOriginal | null,
  locale: string,
  signal: AbortSignal,
) {
  const options = original
    ? captureSubmission(input, original.file, original.metadata, locale)
    : mutation("POST", input);
  const session = await api(
    original ? "/security/sessions/capture" : "/security/sessions",
    sessionSchema,
    { ...options, signal },
  );
  if (!original) return { session, originalRetained: true };
  try {
    signal.throwIfAborted();
    const response = await api(
      "/auth/me",
      z.union([userSchema, z.object({ user: userSchema }).strict()]),
      { signal },
    );
    const user = "user" in response ? response.user : response;
    signal.throwIfAborted();
    await retainEvidence(
      `${user.tenant_id}:${user.id}`,
      session.id,
      original.file,
      original.metadata,
    );
    signal.throwIfAborted();
    return { session, originalRetained: true };
  } catch (error) {
    if (signal.aborted) throw error;
    return { session, originalRetained: false };
  }
}
