"use client";

import { Download, LockKeyhole, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { usePreferences } from "@/features/preferences/Preferences";
import {
  createFileIdentity,
  MAX_ENVELOPE_BYTES,
  MAX_FILE_BYTES,
  openFile,
  recipientFingerprint,
  sealFile,
} from "@/lib/pq-envelope";
import { fileMessages } from "./messages";

function download(data: BlobPart, name: string) {
  const url = URL.createObjectURL(
    new Blob([data], { type: "application/octet-stream" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download =
    name
      .split(/[\\/]/)
      .at(-1)
      ?.replace(/[^\p{L}\p{N} ._()-]/gu, "_") || "oknef-file";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function LocalFiles() {
  const { locale } = usePreferences();
  const text = fileMessages[locale];
  const [recipient, setRecipient] = useState("");
  const [fingerprint, setFingerprint] = useState("");
  const [recovery, setRecovery] = useState("");
  const [saved, setSaved] = useState(false);
  const [source, setSource] = useState<File | null>(null);
  const [sealed, setSealed] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "busy" | "done" | "failed">(
    "idle",
  );
  const pending = status === "busy";
  useEffect(() => {
    let active = true;
    recipientFingerprint(recipient)
      .then((value) => {
        if (active) setFingerprint(value);
      })
      .catch(() => {
        if (active) setFingerprint("");
      });
    return () => {
      active = false;
    };
  }, [recipient]);
  async function run(action: () => Promise<void>) {
    setStatus("busy");
    try {
      await action();
      setStatus("done");
    } catch {
      setStatus("failed");
    }
  }
  async function create() {
    const identity = await createFileIdentity();
    setRecipient(identity.recipient);
    setRecovery(identity.recovery);
    setSaved(false);
  }
  async function protect() {
    if (!source || source.size > MAX_FILE_BYTES) throw new Error("File size");
    const data = new Uint8Array(await source.arrayBuffer());
    try {
      download(
        await sealFile(
          { name: source.name, type: source.type, data },
          recipient,
        ),
        "protected.oknefq",
      );
    } finally {
      data.fill(0);
    }
  }
  async function decrypt() {
    if (!sealed || sealed.size > MAX_ENVELOPE_BYTES)
      throw new Error("Envelope size");
    const result = await openFile(await sealed.text(), recovery);
    try {
      download(new Uint8Array(result.data), result.name);
    } finally {
      result.data.fill(0);
    }
  }
  return (
    <section className="space-y-6">
      <header>
        <h1 className="page-title">{text.title}</h1>
        <p className="subtext mt-3 max-w-3xl">{text.intro}</p>
      </header>
      <p className="panel text-sm leading-6 text-secondary">
        <ShieldCheck className="mb-3 text-good" size={22} />
        {text.boundary}
      </p>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel space-y-4">
          <Button disabled={pending} onClick={() => run(create)}>
            <LockKeyhole size={16} />
            {text.create}
          </Button>
          <label className="block">
            <span className="field-label">{text.recipient}</span>
            <textarea
              className="field min-h-24 font-mono text-xs"
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
              disabled={pending}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <p className="subtext">{text.share}</p>
          {fingerprint && (
            <div className="rounded-xl bg-muted p-4">
              <p className="subtext">{text.fingerprint}</p>
              <p className="mt-2 break-all font-mono text-xs">{fingerprint}</p>
            </div>
          )}
          <label className="block">
            <span className="field-label">{text.recovery}</span>
            <input
              className="field font-mono text-xs"
              type="password"
              value={recovery}
              onChange={(event) => setRecovery(event.target.value)}
              disabled={pending}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <p className="subtext">{text.keyWarning}</p>
          <Button
            variant="secondary"
            disabled={!recovery || pending}
            onClick={() => download(recovery, "oknef-private-recovery.txt")}
          >
            <Download size={16} />
            {text.export}
          </Button>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={saved}
              onChange={(event) => setSaved(event.target.checked)}
              disabled={pending}
            />
            {text.acknowledge}
          </label>
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => {
              setRecipient("");
              setRecovery("");
              setSaved(false);
              setStatus("idle");
            }}
          >
            {text.clear}
          </Button>
        </section>
        <section className="panel space-y-6">
          <label className="block">
            <span className="field-label">{text.file}</span>
            <input
              className="field"
              type="file"
              disabled={pending}
              onChange={(event) => setSource(event.target.files?.[0] ?? null)}
            />
          </label>
          <Button
            disabled={
              pending || !source || !fingerprint || (!!recovery && !saved)
            }
            onClick={() => run(protect)}
          >
            {text.protect}
          </Button>
          <hr className="border-border" />
          <label className="block">
            <span className="field-label">{text.protectedFile}</span>
            <input
              className="field"
              type="file"
              accept=".oknefq"
              disabled={pending}
              onChange={(event) => setSealed(event.target.files?.[0] ?? null)}
            />
          </label>
          <Button
            variant="secondary"
            disabled={pending || !sealed || !recovery}
            onClick={() => run(decrypt)}
          >
            {text.open}
          </Button>
          {status !== "idle" && (
            <p
              role={status === "failed" ? "alert" : "status"}
              className={
                status === "failed" ? "text-sm text-danger" : "subtext"
              }
            >
              {text[status]}
            </p>
          )}
        </section>
      </div>
    </section>
  );
}
