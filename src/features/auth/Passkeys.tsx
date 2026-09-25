"use client";
import { Fingerprint } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/buttons/Button/Button";
import { usePreferences } from "@/features/preferences/Preferences";
import { vaultMessages } from "@/features/vault/messages";
import { api, mutation, userSchema } from "@/lib/api";
import {
  parseCreation,
  parseRequest,
  serializeCredential,
} from "@/lib/passkeys";

const challengeSchema = z
  .object({ challenge_id: z.uuid(), options: z.unknown() })
  .strict();
function supported() {
  return typeof PublicKeyCredential !== "undefined" && window.isSecureContext;
}
export function PasskeyEnroll() {
  const { locale } = usePreferences();
  const text = vaultMessages[locale];
  const [status, setStatus] = useState<
    "idle" | "pending" | "saved" | "error" | "unsupported"
  >("idle");
  async function enroll() {
    if (!supported()) {
      setStatus("unsupported");
      return;
    }
    setStatus("pending");
    try {
      const options = await api(
        "/passkeys/register/start",
        challengeSchema,
        mutation("POST", {}),
      );
      const credential = await navigator.credentials.create(
        parseCreation(options.options),
      );
      await api(
        "/passkeys/register/finish",
        z.object({ registered: z.literal(true) }).strict(),
        mutation("POST", {
          challenge_id: options.challenge_id,
          credential: serializeCredential(credential),
        }),
      );
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }
  return (
    <section className="panel mt-6 max-w-2xl">
      <Fingerprint size={27} className="text-good" />
      <h2 className="mt-5 text-lg font-semibold">{text.passkeys}</h2>
      <p className="subtext mt-3">{text.passkeyBody}</p>
      <p className="mt-3 text-xs leading-6 text-secondary">
        {text.passkeyHint}
      </p>
      <Button className="mt-6" disabled={status === "pending"} onClick={enroll}>
        <Fingerprint size={17} />
        {text.addPasskey}
      </Button>
      {status === "saved" && (
        <output className="mt-4 block text-sm text-good">
          {text.passkeySaved}
        </output>
      )}
      {(status === "error" || status === "unsupported") && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {
            text[
              status === "unsupported" ? "passkeyUnsupported" : "passkeyFailed"
            ]
          }
        </p>
      )}
    </section>
  );
}
export function PasskeySignIn({
  email,
  onSuccess,
}: {
  email: string;
  onSuccess: () => void;
}) {
  const { locale } = usePreferences();
  const text = vaultMessages[locale];
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  async function signIn() {
    setError(false);
    if (!supported() || !z.email().safeParse(email).success) {
      setError(true);
      return;
    }
    setPending(true);
    try {
      const options = await api(
        "/passkeys/login/start",
        challengeSchema,
        mutation("POST", { email }),
      );
      const credential = await navigator.credentials.get(
        parseRequest(options.options),
      );
      await api(
        "/passkeys/login/finish",
        z.object({ user: userSchema }).strict(),
        mutation("POST", {
          challenge_id: options.challenge_id,
          credential: serializeCredential(credential),
        }),
      );
      onSuccess();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="mt-4">
      <Button
        variant="secondary"
        className="w-full"
        disabled={pending}
        onClick={signIn}
      >
        <Fingerprint size={17} />
        {text.passkeyLogin}
      </Button>
      {error && (
        <p role="alert" className="mt-3 text-xs leading-5 text-danger">
          {text.passkeyFailed}
        </p>
      )}
    </div>
  );
}
