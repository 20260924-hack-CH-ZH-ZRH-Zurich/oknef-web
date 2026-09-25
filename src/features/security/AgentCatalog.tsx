import { ArrowUpRight, GitBranch, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/buttons/Button/Button";
import { workflowLabels } from "@/features/chat/workflowLabels";
import { workflowSchema } from "@/features/chat/workflows";
import { usePreferences } from "@/features/preferences/Preferences";
import { api } from "@/lib/api";
import { useSecurityMessages } from "./messages";

const roleSchema = z.enum([
  "manager",
  "inventory",
  "identity",
  "succession",
  "verifier",
  "phishing",
  "voice",
  "document",
  "recovery",
  "policy",
  "educator",
  "visual",
  "advisor",
]);
const catalogSchema = z
  .object({
    version: z.string(),
    roles: z.record(roleSchema, z.string()),
    skills: z.record(
      z.string().regex(/^[a-z-]+$/),
      z.object({ input: z.string(), checks: z.array(z.string()) }).strict(),
    ),
    workflows: z.record(
      workflowSchema.shape.workflow,
      z
        .object({ roles: z.array(roleSchema), skills: z.array(z.string()) })
        .strict(),
    ),
    execution: z.literal("allowlisted_advisory_checklists"),
    tool_permissions: z.array(z.never()).length(0),
    automatic_learning: z.literal(false),
    review_required: z.literal(true),
    provider_path: z.literal("openclaw-via-rust-core"),
  })
  .strict();
const words = {
  en: {
    title: "Agent operations",
    body: "Inspect the current server catalog, choose a review workflow and understand its limits. These agents prepare findings for a person; they cannot execute actions.",
    roles: "Agent roles",
    skills: "Bounded checklists",
    workflows: "Review workflows",
    details: "View source checklist",
    run: "Open review",
    boundary:
      "No tool execution · no automatic training · human review required",
  },
  es: {
    title: "Operaciones de agentes",
    body: "Consulta el catálogo actual, elige un flujo de revisión y conoce sus límites. Los agentes preparan resultados para una persona; no ejecutan acciones.",
    roles: "Roles de agentes",
    skills: "Listas acotadas",
    workflows: "Flujos de revisión",
    details: "Ver lista de origen",
    run: "Abrir revisión",
    boundary: "Sin ejecución · sin entrenamiento automático · revisión humana",
  },
  de: {
    title: "Agentenbetrieb",
    body: "Prüfe den aktuellen Serverkatalog, wähle einen Ablauf und beachte seine Grenzen. Agenten erstellen Ergebnisse für Menschen; sie führen keine Aktionen aus.",
    roles: "Agentenrollen",
    skills: "Begrenzte Prüflisten",
    workflows: "Prüfabläufe",
    details: "Quellprüfliste anzeigen",
    run: "Prüfung öffnen",
    boundary:
      "Keine Ausführung · kein automatisches Training · menschliche Prüfung",
  },
  fr: {
    title: "Opérations des agents",
    body: "Consultez le catalogue actuel, choisissez un parcours d’examen et comprenez ses limites. Les agents préparent des conclusions ; ils n’exécutent aucune action.",
    roles: "Rôles des agents",
    skills: "Listes délimitées",
    workflows: "Parcours d’examen",
    details: "Voir la liste source",
    run: "Ouvrir l’examen",
    boundary:
      "Aucune exécution · aucun entraînement automatique · examen humain",
  },
};
export function AgentCatalog() {
  const { locale } = usePreferences();
  const m = useSecurityMessages();
  const w = words[locale];
  const [data, setData] = useState<z.infer<typeof catalogSchema> | null>(null);
  const [error, setError] = useState(false);
  const refresh = useCallback(async () => {
    try {
      setData(await api("/agents/catalog", catalogSchema));
      setError(false);
    } catch {
      setError(true);
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Oknef</p>
          <h1 className="page-title mt-3">{w.title}</h1>
          <p className="subtext mt-4 max-w-3xl">{w.body}</p>
        </div>
        <Button variant="secondary" onClick={refresh}>
          {m.refresh}
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-5 text-sm text-danger">
          {m.error}
        </p>
      )}
      {data ? (
        <>
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            {[
              {
                label: w.roles,
                count: Object.keys(data.roles).length,
                icon: Users,
              },
              {
                label: w.skills,
                count: Object.keys(data.skills).length,
                icon: ShieldCheck,
              },
              {
                label: w.workflows,
                count: Object.keys(data.workflows).length,
                icon: GitBranch,
              },
            ].map(({ label, count, icon: Icon }) => (
              <section className="panel" key={label}>
                <Icon className="mb-4 text-good" size={23} />
                <h2 className="text-xs text-secondary">{label}</h2>
                <p className="mt-3 text-3xl font-semibold">{count}</p>
              </section>
            ))}
          </div>
          <p className="mt-5 rounded-xl border border-border p-4 text-xs text-secondary">
            {w.boundary}
          </p>
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Object.entries(data.workflows).map(([workflow, definition]) => (
              <section key={workflow} className="panel">
                <h2 className="font-semibold">
                  {
                    workflowLabels[locale][
                      workflow as keyof typeof data.workflows
                    ]
                  }
                </h2>
                <p className="mt-3 text-xs text-secondary">
                  {definition.roles.join(" → ")} → verifier
                </p>
                <details className="mt-4 text-xs">
                  <summary className="cursor-pointer">{w.details}</summary>
                  <p className="mt-3 leading-5 text-secondary">
                    {m.sourceLanguage}
                  </p>
                  {definition.skills.map((id) => (
                    <div className="mt-4" key={id}>
                      <code>{id}</code>
                      <ul className="mt-2 list-inside list-disc space-y-2 text-secondary">
                        {data.skills[id]?.checks.map((check) => (
                          <li key={check}>{check}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </details>
                <Link
                  className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-good"
                  href={`/workspace?view=assistant&workflow=${encodeURIComponent(workflow)}`}
                >
                  {w.run}
                  <ArrowUpRight size={15} />
                </Link>
              </section>
            ))}
          </div>
          <p className="mt-5 text-xs text-secondary">
            {data.version} · {data.provider_path}
          </p>
        </>
      ) : (
        !error && <p className="subtext mt-6">{m.loading}</p>
      )}
    </>
  );
}
