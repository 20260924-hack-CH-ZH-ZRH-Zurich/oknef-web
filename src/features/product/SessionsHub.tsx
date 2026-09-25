import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/buttons/Button/Button";
import { Chat } from "@/features/chat/Chat";
import {
  type SecuritySession,
  sessionSchema,
} from "@/features/security/contracts";
import { SessionDetail } from "@/features/security/SessionDetail";
import { api } from "@/lib/api";
import { Connections } from "./Connections";
import { chatSessionSchema } from "./contracts";
import { useProductMessages } from "./messages";
import { WorkflowHistory } from "./WorkflowHistory";
export function SessionsHub() {
  const m = useProductMessages();
  const [tab, setTab] = useState("history");
  const [sessions, setSessions] = useState<z.infer<typeof chatSessionSchema>[]>(
    [],
  );
  const [checks, setChecks] = useState<SecuritySession[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<SecuritySession | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    void Promise.all([
      api(
        "/chat/sessions",
        z.object({ sessions: z.array(chatSessionSchema) }).strict(),
      ),
      api(
        "/security/sessions",
        z.object({ sessions: z.array(sessionSchema) }).strict(),
      ),
    ])
      .then(([chats, security]) => {
        setSessions(chats.sessions);
        setChecks(security.sessions);
      })
      .catch(() => setError(true));
  }, []);
  if (selected)
    return (
      <div>
        <Button variant="ghost" onClick={() => setSelected(null)}>
          {m.back}
        </Button>
        <Chat key={selected} initialSessionId={selected} />
      </div>
    );
  if (evidence)
    return (
      <SessionDetail
        session={evidence}
        onUpdated={setEvidence}
        onBack={() => setEvidence(null)}
      />
    );
  return (
    <section className="space-y-6">
      <h1 className="page-title">{m.sessions}</h1>
      <nav className="flex gap-3">
        {["history", "sessionGraph", "agentRuns"].map((value) => (
          <Button
            variant={tab === value ? "primary" : "secondary"}
            key={value}
            onClick={() => setTab(value)}
          >
            {m[value as "history" | "sessionGraph" | "agentRuns"]}
          </Button>
        ))}
      </nav>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {m.error}
        </p>
      )}
      {tab === "agentRuns" ? (
        <WorkflowHistory />
      ) : tab === "sessionGraph" ? (
        <Connections sessionsOnly />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          <section className="space-y-3">
            <h2 className="font-semibold">{m.history}</h2>
            {sessions.map((item) => (
              <button
                type="button"
                key={item.id}
                className="panel block w-full text-left"
                onClick={() => setSelected(item.id)}
              >
                <span className="tag">{m.savedSession}</span>
                <h3 className="mt-3 font-semibold">{item.title}</h3>
              </button>
            ))}
            {!sessions.length && <p className="subtext">{m.empty}</p>}
          </section>
          <section className="space-y-3">
            <h2 className="font-semibold">{m.evidence}</h2>
            {checks.map((item) => (
              <button
                type="button"
                key={item.id}
                className="panel block w-full text-left"
                onClick={() => setEvidence(item)}
              >
                <span className="tag">{item.kind}</span>
                <h3 className="mt-3 font-semibold">{item.title}</h3>
                <p className="subtext mt-2">{item.assessment.status}</p>
              </button>
            ))}
            {!checks.length && <p className="subtext">{m.empty}</p>}
          </section>
        </div>
      )}
    </section>
  );
}
