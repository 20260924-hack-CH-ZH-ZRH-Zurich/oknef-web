import Image from "next/image";
import { useState } from "react";
import { usePreferences } from "@/features/preferences/Preferences";
import { AgentCatalog } from "@/features/security/AgentCatalog";
import { useProductMessages } from "./messages";
export function PlatformLab() {
  const m = useProductMessages();
  const { locale } = usePreferences();
  const [tab, setTab] = useState("diagrams");
  const diagrams = [
    { name: m.drive, src: `/guides/encryption-${locale}.svg` },
    { name: m.topology, src: `/guides/topology-${locale}.svg` },
    { name: m.company, src: `/guides/tenants-${locale}.svg` },
    { name: m.sessions, src: `/diagrams/completion/sessions-${locale}.svg` },
    { name: m.identities, src: `/diagrams/completion/privacy-${locale}.svg` },
    { name: m.trustMode, src: `/diagrams/completion/voice-${locale}.svg` },
    { name: m.linkedAssets, src: `/guides/succession-${locale}.svg` },
  ];
  return (
    <section className="space-y-6">
      <header>
        <h1 className="page-title">{m.admin}</h1>
        <p className="subtext mt-3 max-w-3xl">{m.diagramIntro}</p>
      </header>
      <nav className="flex gap-3" aria-label={m.admin}>
        {["diagrams", "operations"].map((value) => (
          <button
            type="button"
            key={value}
            onClick={() => setTab(value)}
            aria-current={tab === value ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm ${tab === value ? "bg-rail text-white" : "bg-muted"}`}
          >
            {m[value as "diagrams" | "operations"]}
          </button>
        ))}
      </nav>
      {tab === "operations" ? (
        <AgentCatalog />
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {diagrams.map((diagram) => (
            <figure key={diagram.src} className="panel">
              <figcaption className="mb-4 font-semibold">
                {diagram.name}
              </figcaption>
              <a href={diagram.src} target="_blank" rel="noopener noreferrer">
                <Image
                  src={diagram.src}
                  alt={diagram.name}
                  width={1200}
                  height={700}
                  unoptimized
                  className="h-auto w-full rounded-xl bg-white"
                />
              </a>
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}
