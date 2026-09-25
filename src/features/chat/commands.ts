import { type Workflow, workflowSchema } from "./workflows";
export const miniAppNames = [
  "qr",
  "link",
  "email",
  "call",
  "document",
  "video",
  "identity",
] as const;
export type MiniAppName = (typeof miniAppNames)[number];
export const workspaceViews = [
  "miniapps",
  "drive",
  "integrations",
  "topology",
  "sessions",
  "assets",
  "security",
  "legacy",
  "admin",
] as const;
export type WorkspaceView = (typeof workspaceViews)[number];
export function workspacePath(locale: string, view: string) {
  const aliases: Record<string, string> = {
    topology: "connections",
    assets: "vault",
    legacy: "succession",
  };
  return `/${locale}/workspace?view=${aliases[view] || view}`;
}
export type ChatCommand =
  | { type: "miniapp"; kind: MiniAppName }
  | { type: "navigate"; view: WorkspaceView }
  | { type: "new" }
  | { type: "plan"; content: string }
  | { type: "message"; content: string };
export function parseCommand(input: string): ChatCommand {
  const trimmed = input.trim();
  const match = /^\/([a-z]+)(?:\s+([\s\S]*))?$/i.exec(trimmed);
  if (!match) {
    const open =
      /^(?:(?:please|por favor|bitte|s’il vous plaît)\s+)?(?:open|launch|start|abre|abrir|öffne|starte|ouvre|ouvrir|lance)\s+(?:(?:the|my|la|el|die|das|le|mon|mi)\s+)?(?:mini[ -]?app\s+)?(qr|link|email|call|document|video|identity)(?:\s+(?:mini[ -]?app|app|scanner))?[.!?]?$/i.exec(
        trimmed,
      );
    if (open)
      return { type: "miniapp", kind: open[1].toLowerCase() as MiniAppName };
    const patterns: [MiniAppName, RegExp][] = [
      [
        "qr",
        /^(?:(?:please|por favor|bitte)\s+)?(?:scan|check|inspect|escanear|escanea|prüfe|scanne|scanner|vérifier)\s+(?:(?:a|the|this|my|un|el|este|einen?|den|diesen|le|ce)\s+)?(?:qr(?:\s+code)?|code\s+qr|código\s+qr|qr-code)[.!?]?$/i,
      ],
      [
        "email",
        /^(?:please\s+)?(?:check|inspect|review|revisa|prüfe|vérifier)\s+(?:(?:this|my|an?|the|un|el|este|die|diese|le|ce)\s+)?(?:email|e-mail|correo)[.!?]?$/i,
      ],
      [
        "video",
        /^(?:please\s+)?(?:check|analyze|review|analiza|prüfe|analyser)\s+(?:(?:this|my|an?|the|un|el|este|das|dieses|le|ce)\s+)?(?:video|vídeo|vidéo)[.!?]?$/i,
      ],
      [
        "call",
        /^(?:please\s+)?(?:check|review|transcribe|transcribir|transkribiere|transcrire)\s+(?:(?:this|my|an?|the|una?|la|esta|den|diesen|le|cet)\s+)?(?:call|llamada|anruf|appel)[.!?]?$/i,
      ],
      [
        "identity",
        /^(?:please\s+)?(?:check|scan|review|revisa|prüfe|vérifier)\s+(?:(?:this|my|an?|the|mi|el|este|meinen?|den|diesen|mon|le|ce)\s+)?(?:passport|identity document|pasaporte|reisepass|passeport)[.!?]?$/i,
      ],
      [
        "document",
        /^(?:please\s+)?(?:check|scan|review|revisa|prüfe|vérifier)\s+(?:(?:this|my|an?|the|un|el|este|das|dieses|le|ce)\s+)?(?:document|documento|dokument)[.!?]?$/i,
      ],
    ];
    const intent = patterns.find(([, pattern]) => pattern.test(trimmed));
    return intent
      ? { type: "miniapp", kind: intent[0] }
      : { type: "message", content: trimmed };
  }
  const command = match[1].toLowerCase();
  if (miniAppNames.includes(command as MiniAppName))
    return { type: "miniapp", kind: command as MiniAppName };
  if (workspaceViews.includes(command as WorkspaceView))
    return { type: "navigate", view: command as WorkspaceView };
  if (command === "new") return { type: "new" };
  if (command === "plan")
    return {
      type: "plan",
      content: `Create a step-by-step advisory plan. Do not execute actions. ${match[2] || "Help me review my digital estate and identity protection."}`,
    };
  return { type: "message", content: trimmed };
}
export type VoiceAction =
  | { name: "open_miniapp"; arguments: { kind: MiniAppName } }
  | { name: "navigate_workspace"; arguments: { view: string } }
  | {
      name: "read_workspace";
      arguments: {
        reference: "assets" | "sessions" | "integrations" | "workspace";
      };
    }
  | {
      name: "run_advisory_workflow";
      arguments: { workflow: Workflow; message: string };
    };
export function parseVoiceAction(
  name: unknown,
  input: unknown,
): VoiceAction | null {
  if (typeof input !== "string" || input.length > 7000) return null;
  try {
    const args: unknown = JSON.parse(input);
    if (!args || typeof args !== "object" || Array.isArray(args)) return null;
    const value = args as Record<string, unknown>;
    if (
      name === "read_workspace" &&
      Object.keys(value).length === 1 &&
      ["assets", "sessions", "integrations", "workspace"].includes(
        String(value.reference),
      )
    )
      return {
        name,
        arguments: {
          reference: value.reference as
            | "assets"
            | "sessions"
            | "integrations"
            | "workspace",
        },
      };
    const workflow = workflowSchema.shape.workflow.safeParse(value.workflow);
    if (
      name === "run_advisory_workflow" &&
      Object.keys(value).length === 2 &&
      workflow.success &&
      typeof value.message === "string" &&
      value.message.trim() &&
      value.message.length <= 5000
    )
      return {
        name,
        arguments: { workflow: workflow.data, message: value.message },
      };
    if (
      name === "open_miniapp" &&
      Object.keys(value).length === 1 &&
      miniAppNames.includes(value.kind as MiniAppName)
    )
      return { name, arguments: { kind: value.kind as MiniAppName } };
    if (
      name === "navigate_workspace" &&
      Object.keys(value).length === 1 &&
      workspaceViews.includes(String(value.view) as WorkspaceView)
    )
      return { name, arguments: { view: String(value.view) } };
  } catch {
    return null;
  }
  return null;
}
