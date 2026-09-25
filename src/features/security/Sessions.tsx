import {
  ArrowUpRight,
  FileSearch,
  Link2,
  Mail,
  Phone,
  ScanQrCode,
} from "lucide-react";
import type { SecuritySession, SessionKind } from "./contracts";
import { useSecurityMessages } from "./messages";
export function Sessions({
  sessions,
  onNew,
  onSelect,
}: {
  sessions: SecuritySession[];
  onNew: (kind: SessionKind) => void;
  onSelect: (id: string) => void;
}) {
  const m = useSecurityMessages();
  const tools = [
    { kind: "qr", icon: ScanQrCode },
    { kind: "link", icon: Link2 },
    { kind: "email", icon: Mail },
    { kind: "call", icon: Phone },
    { kind: "document", icon: FileSearch },
  ] as const;
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {tools.map(({ kind, icon: Icon }) => (
          <button
            type="button"
            key={kind}
            onClick={() => onNew(kind)}
            className="group rounded-2xl border border-border bg-surface p-5 text-left transition hover:border-good"
          >
            <div className="mb-5 flex items-center justify-between">
              <Icon size={23} className="text-good" />
              <ArrowUpRight size={15} className="text-secondary" />
            </div>
            <span className="text-sm font-semibold">{m[kind]}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 rounded-2xl border border-border bg-surface p-5">
        <a
          href="/downloads/oknef-extension.zip"
          download="oknef-extension.zip"
          className="inline-flex items-center gap-2 text-sm font-semibold text-good"
        >
          {m.extensionTitle}
          <ArrowUpRight size={15} />
        </a>
        <p className="mt-2 max-w-3xl text-xs leading-6 text-secondary">
          {m.extensionHelp}
        </p>
      </div>
      <section className="mt-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{m.sessions}</h2>
          <span className="tag">{sessions.length}</span>
        </div>
        {sessions.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {sessions.map((session) => (
              <button
                type="button"
                key={session.id}
                onClick={() => onSelect(session.id)}
                className="panel text-left transition hover:border-good"
              >
                <div className="flex flex-wrap gap-2">
                  <span className="tag">{m[session.kind]}</span>
                  <span className="tag">
                    {session.synthetic
                      ? m.synthetic
                      : m[session.assessment.status]}
                  </span>
                </div>
                <h3 className="mt-4 font-semibold">{session.title}</h3>
                <p className="mt-3 flex items-center justify-between text-xs text-secondary">
                  <span>
                    {session.assessment.signals.length} · {m.signal}
                  </span>
                  <ArrowUpRight size={17} />
                </p>
              </button>
            ))}
          </div>
        ) : (
          <div className="panel py-12 text-center">
            <FileSearch className="mx-auto text-good" size={32} />
            <h3 className="mt-5 text-lg font-semibold">{m.empty}</h3>
            <p className="subtext mx-auto mt-3 max-w-xl">{m.emptyBody}</p>
          </div>
        )}
      </section>
    </>
  );
}
