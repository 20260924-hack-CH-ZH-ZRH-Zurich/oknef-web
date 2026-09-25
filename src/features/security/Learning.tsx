import { Bug, Fingerprint, Mail, ScanQrCode } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { api, mutation } from "@/lib/api";
import { type SecuritySession, sessionSchema } from "./contracts";
import { useSecurityMessages } from "./messages";
export function Learning({
  onSaved,
}: {
  onSaved: (session: SecuritySession) => void;
}) {
  const m = useSecurityMessages();
  const [pending, setPending] = useState("");
  const [error, setError] = useState(false);
  async function start(kind: string) {
    setPending(kind);
    setError(false);
    try {
      onSaved(
        await api(
          "/security/simulations",
          sessionSchema,
          mutation("POST", { kind }),
        ),
      );
    } catch {
      setError(true);
    } finally {
      setPending("");
    }
  }
  const exercises = [
    { kind: "phishing", icon: Mail },
    { kind: "prompt_injection", icon: ScanQrCode },
    { kind: "honeytoken", icon: Bug },
    { kind: "deepfake", icon: Fingerprint },
  ] as const;
  return (
    <>
      <h2 className="text-2xl font-semibold">{m.learningTitle}</h2>
      <p className="subtext mt-4 max-w-3xl">{m.learningHelp}</p>
      <div className="mt-7 grid gap-5 md:grid-cols-2">
        {exercises.map(({ kind, icon: Icon }) => (
          <article key={kind} className="panel">
            <div className="mb-5 flex items-center justify-between">
              <Icon size={26} className="text-good" />
              <span className="tag">{m.learningBadge}</span>
            </div>
            <h3 className="text-lg font-semibold">{m[kind]}</h3>
            <p className="subtext mt-3">
              {kind === "honeytoken"
                ? m.honeyHelp
                : kind === "deepfake"
                  ? m.callHelp
                  : kind === "prompt_injection"
                    ? m.qrHelp
                    : m.emailHelp}
            </p>
            <Button
              className="mt-6"
              variant="secondary"
              disabled={!!pending}
              onClick={() => start(kind)}
            >
              {pending === kind ? m.checking : m.startPractice}
            </Button>
          </article>
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-5 text-sm text-danger">
          {m.error}
        </p>
      )}
    </>
  );
}
