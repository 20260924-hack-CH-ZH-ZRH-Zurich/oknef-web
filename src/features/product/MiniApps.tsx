import {
  ArrowUpRight,
  FileSearch,
  Fingerprint,
  Link2,
  Mail,
  Phone,
  ScanQrCode,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { useCaptureMessages } from "@/features/capture/messages";
import {
  type SecuritySession,
  type SessionKind,
  sessionKindSchema,
} from "@/features/security/contracts";
import { useSecurityMessages } from "@/features/security/messages";
import { SessionDetail } from "@/features/security/SessionDetail";
import { SessionForm } from "@/features/security/SessionForm";
import { useProductMessages } from "./messages";
export const miniAppTools = [
  { kind: "qr", icon: ScanQrCode },
  { kind: "link", icon: Link2 },
  { kind: "email", icon: Mail },
  { kind: "call", icon: Phone },
  { kind: "document", icon: FileSearch },
  { kind: "video", icon: Video },
  { kind: "identity", icon: Fingerprint },
] as const;
export function MiniAppLauncher({
  onSelect,
}: {
  onSelect: (kind: SessionKind) => void;
}) {
  const m = useSecurityMessages();
  const capture = useCaptureMessages();
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {miniAppTools.map(({ kind, icon: Icon }) => (
        <button
          key={kind}
          type="button"
          onClick={() => onSelect(kind)}
          className="group rounded-2xl border border-border bg-surface p-6 text-left transition hover:border-good"
        >
          <div className="mb-5 flex justify-between">
            <Icon className="text-good" size={28} />
            <ArrowUpRight size={17} className="text-secondary" />
          </div>
          <h2 className="text-base font-semibold">
            {kind === "document"
              ? capture.document
              : kind === "identity"
                ? capture.face
                : m[kind]}
          </h2>
          <p className="mt-3 text-xs leading-6 text-secondary">
            {kind === "video"
              ? capture.videoHelp
              : kind === "identity"
                ? capture.faceHelp
                : m[`${kind}Help`]}
          </p>
        </button>
      ))}
      <Link
        href="/workspace?view=identity"
        className="group rounded-2xl border border-border bg-surface p-6 text-left transition hover:border-good"
      >
        <div className="mb-5 flex justify-between">
          <Fingerprint className="text-good" size={28} />
          <ArrowUpRight size={17} className="text-secondary" />
        </div>
        <h2 className="text-base font-semibold">{capture.passkey}</h2>
        <p className="mt-3 text-xs leading-6 text-secondary">
          {capture.passkeyHelp}
        </p>
      </Link>
    </div>
  );
}
export function MiniApps({ onSaved }: { onSaved: () => void }) {
  const m = useProductMessages();
  const capture = useCaptureMessages();
  const params = useSearchParams();
  const initial = sessionKindSchema.safeParse(params.get("app"));
  const [kind, setKind] = useState<SessionKind | null>(
    initial.success ? initial.data : null,
  );
  const [session, setSession] = useState<SecuritySession | null>(null);
  const requestedApp = params.get("app");
  useEffect(() => {
    const next = sessionKindSchema.safeParse(requestedApp);
    if (next.success) {
      setKind(next.data);
      setSession(null);
    }
  }, [requestedApp]);
  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">OKNEF</p>
        <h1 className="page-title mt-3">{m.miniapps}</h1>
        <p className="subtext mt-3">{m.noAutomaticAction}</p>
      </header>
      {session ? (
        <SessionDetail
          session={session}
          onUpdated={setSession}
          onBack={() => setSession(null)}
        />
      ) : (
        <>
          {!kind && <MiniAppLauncher onSelect={setKind} />}
          {kind && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setKind(null)}
            >
              {capture.back}
            </Button>
          )}
          {kind && (
            <SessionForm
              key={kind}
              kind={kind}
              inline
              onClose={() => setKind(null)}
              onSaved={(value) => {
                setSession(value);
                onSaved();
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
