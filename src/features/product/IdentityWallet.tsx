import { Fingerprint, LockKeyhole, ScanFace } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { usePreferences } from "@/features/preferences/Preferences";
import type { SecuritySession } from "@/features/security/contracts";
import { SessionDetail } from "@/features/security/SessionDetail";
import { SessionForm } from "@/features/security/SessionForm";
import { useProductMessages } from "./messages";
export function IdentityWallet() {
  const m = useProductMessages();
  const { locale } = usePreferences();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<SecuritySession | null>(null);
  return (
    <section className="space-y-6">
      <header>
        <h1 className="page-title">{m.identities}</h1>
        <p className="subtext mt-3 max-w-3xl">{m.identityIntro}</p>
      </header>
      {session ? (
        <SessionDetail
          session={session}
          onUpdated={setSession}
          onBack={() => setSession(null)}
        />
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2">
            <article className="panel">
              <Fingerprint size={36} className="text-good" />
              <h2 className="mt-6 text-xl font-semibold">{m.passport}</h2>
              <p className="subtext mt-3">{m.identityHelp}</p>
              <span className="tag mt-4">{m.verified}</span>
              <div className="mt-6">
                <Button onClick={() => setOpen(true)}>
                  <ScanFace size={17} />
                  {m.start}
                </Button>
              </div>
            </article>
            <Link href={`/${locale}/workspace?view=secrets`} className="panel">
              <LockKeyhole size={36} className="text-good" />
              <h2 className="mt-6 text-xl font-semibold">{m.secureVault}</h2>
              <p className="subtext mt-3">{m.driveBoundary}</p>
            </Link>
          </div>
          {open && (
            <SessionForm
              inline
              kind="identity"
              onClose={() => setOpen(false)}
              onSaved={setSession}
            />
          )}
        </>
      )}
    </section>
  );
}
