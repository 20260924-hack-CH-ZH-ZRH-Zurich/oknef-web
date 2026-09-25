import { z } from "zod";
import { timestampSchema, utf8String } from "@/lib/api";

const findingSchema = z
  .object({
    agent: z.enum([
      "inventory",
      "succession",
      "identity",
      "manager",
      "verifier",
      "phishing",
      "voice",
      "document",
      "recovery",
      "policy",
      "educator",
      "visual",
      "advisor",
    ]),
    answer: utf8String(40000).min(1),
    source: z.literal("openclaw-via-rust-core"),
  })
  .strict();
export const workflowSchema = z
  .object({
    id: z.string(),
    run_state: z.literal("completed").optional(),
    locale: z.enum(["en", "es", "de", "fr"]).optional(),
    created_at: timestampSchema.optional(),
    started_at: timestampSchema.optional(),
    updated_at: timestampSchema.optional(),
    completed_at: timestampSchema.optional(),
    created_by: z.string().optional(),
    synthetic: z.boolean().optional(),
    input_sha256: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .optional(),
    status: z.literal("needs_human_review"),
    workflow: z.enum([
      "legacy-review",
      "identity-review",
      "phishing-review",
      "qr-review",
      "call-review",
      "document-review",
      "recovery-review",
      "policy-review",
      "simulation-review",
      "video-review",
      "trusted-voice-review",
      "advisor-review",
    ]),
    findings: z.array(findingSchema).length(2),
    review: findingSchema.extend({ agent: z.literal("verifier") }),
    executed_actions: z.array(z.never()).length(0),
    provider: z.literal("openclaw-via-rust-core"),
    catalog_version: z.string(),
    skill_ids: z.array(z.string()).min(1),
    review_scope: z
      .object({
        truncated: z.boolean(),
        input_characters: z.number().int().nonnegative(),
        reviewed_characters: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict();
export type WorkflowReply = z.infer<typeof workflowSchema>;
export type Workflow = WorkflowReply["workflow"];
export const workflowText = {
  en: {
    mode: "Review with agents",
    legacy: "Legacy review",
    identity: "Identity review",
    working: "The agent team is reviewing your request…",
    review: "Verifier review",
    notice:
      "Advisory findings require human review. No assets, access rights, or funds were released.",
    source: "Source",
    limit: "Maximum 5,000 characters",
    hint: "Describe a succession or identity question. Do not include passwords, keys, or identity documents.",
  },
  de: {
    mode: "Mit Agenten prüfen",
    legacy: "Nachlassprüfung",
    identity: "Identitätsprüfung",
    working: "Das Agententeam prüft Ihre Anfrage…",
    review: "Prüfung durch Verifizierer",
    notice:
      "Beratende Ergebnisse erfordern eine menschliche Prüfung. Es wurden keine Vermögenswerte, Zugriffsrechte oder Gelder freigegeben.",
    source: "Quelle",
    limit: "Höchstens 5.000 Zeichen",
    hint: "Beschreiben Sie eine Nachlass- oder Identitätsfrage. Keine Passwörter, Schlüssel oder Ausweisdokumente eingeben.",
  },
  es: {
    mode: "Revisar con agentes",
    legacy: "Revisión sucesoria",
    identity: "Revisión de identidad",
    working: "El equipo de agentes está revisando tu solicitud…",
    review: "Revisión del verificador",
    notice:
      "Los resultados orientativos requieren revisión humana. No se han liberado activos, permisos de acceso ni fondos.",
    source: "Fuente",
    limit: "Máximo de 5.000 caracteres",
    hint: "Describe una pregunta de sucesión o identidad. No incluyas contraseñas, claves ni documentos de identidad.",
  },
  fr: {
    mode: "Examiner avec les agents",
    legacy: "Examen successoral",
    identity: "Examen d’identité",
    working: "L’équipe d’agents examine votre demande…",
    review: "Examen du vérificateur",
    notice:
      "Les conclusions consultatives nécessitent un examen humain. Aucun actif, droit d’accès ou fonds n’a été libéré.",
    source: "Source",
    limit: "5 000 caractères maximum",
    hint: "Décrivez une question de succession ou d’identité. N’incluez aucun mot de passe, clé ou document d’identité.",
  },
} as const;
