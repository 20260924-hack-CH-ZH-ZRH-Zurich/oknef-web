import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePreferences } from "@/features/preferences/Preferences";
import { useSecurityMessages } from "./messages";
export function ProtectionExplainer() {
  const m = useSecurityMessages();
  const { locale } = usePreferences();
  return (
    <>
      <h2 className="text-2xl font-semibold">{m.encryption}</h2>
      <p className="subtext mt-4 max-w-3xl">{m.privacyBody}</p>
      <section className="panel mt-6 overflow-auto">
        <Image
          src={`/guides/encryption-${locale}.svg`}
          alt={m.encryption}
          width={1280}
          height={720}
          unoptimized
          className="mb-5 h-auto w-full rounded-xl"
        />
        <Link
          href="/workspace?view=files"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-ink"
        >
          {m.openFiles}
          <ArrowUpRight size={16} />
        </Link>
      </section>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <section className="panel">
          <h3 className="text-lg font-semibold">{m.privacyTitle}</h3>
          <p className="subtext mt-3">{m.privacyBody}</p>
          <Link
            href="/workspace?view=secrets"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-good"
          >
            {m.openVault}
            <ArrowUpRight size={16} />
          </Link>
        </section>
        <section className="panel">
          <h3 className="text-lg font-semibold">{m.humanApproval}</h3>
          <p className="subtext mt-3">{m.recoveryBoundary}</p>
          <Link
            href="/workspace?view=approvals"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-good"
          >
            {m.decisionMap}
            <ArrowUpRight size={16} />
          </Link>
        </section>
      </div>
      <div className="mt-6 space-y-6">
        {(
          [
            { topic: "topology", title: m.topology },
            { topic: "succession", title: m.plans },
            { topic: "tenants", title: m.workspace },
          ] as const
        ).map(({ topic, title }) => (
          <details key={topic} className="panel">
            <summary className="cursor-pointer font-semibold">{title}</summary>
            <Image
              src={`/guides/${topic}-${locale}.svg`}
              alt={title}
              width={1280}
              height={720}
              unoptimized
              className="mt-4 h-auto w-full rounded-xl"
            />
          </details>
        ))}
      </div>
    </>
  );
}
