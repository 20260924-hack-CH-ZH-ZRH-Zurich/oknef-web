"use client";
import {
  ArrowRight,
  Eye,
  EyeOff,
  HeartHandshake,
  LockKeyhole,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/buttons/Button/Button";
import { Brand } from "@/components/ui/data-display/Brand/Brand";
import {
  PreferenceControls,
  usePreferences,
} from "@/features/preferences/Preferences";
import { DemoSwitcher } from "@/features/product/DemoSwitcher";
import { api, errorKey, mutation, userSchema } from "@/lib/api";
import type { TranslationKey } from "@/lib/i18n/en";
import { PasskeySignIn } from "./Passkeys";

const loginResponse = z.union([
  userSchema,
  z.object({ user: userSchema }).strict(),
]);
export function Auth() {
  const { t } = usePreferences();
  const search = useSearchParams();
  const router = useRouter();
  const [register, setRegister] = useState(search.get("mode") === "register");
  const [email, setEmail] = useState("");
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<TranslationKey | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await authenticate(register ? "/auth/register" : "/auth/login", {
      email: form.get("email"),
      password: form.get("password"),
      ...(register
        ? { name: form.get("name"), account_type: form.get("account_type") }
        : {}),
    });
  }
  async function authenticate(path: string, data?: unknown) {
    setPending(true);
    setError(null);
    try {
      await api(path, loginResponse, mutation("POST", data));
      router.push("/workspace");
    } catch (reason) {
      setError(errorKey(reason) as TranslationKey);
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-rail p-12 text-white lg:flex">
        <Link href="/">
          <Brand inverse />
        </Link>
        <div>
          <div className="mb-8 flex size-20 items-center justify-center rounded-3xl border border-accent/30 bg-accent/10 text-accent">
            <HeartHandshake size={36} strokeWidth={1.2} />
          </div>
          <h1 className="max-w-lg text-5xl font-medium leading-tight tracking-tight">
            {t("authTitle")}
          </h1>
          <p className="mt-6 max-w-md text-base leading-8 text-rail-muted">
            {t("authBody")}
          </p>
          <div className="mt-12 flex items-center gap-3">
            <div className="flex -space-x-2">
              {["A", "M", "J"].map((letter) => (
                <span
                  key={letter}
                  className="flex size-10 items-center justify-center rounded-full border-2 border-rail bg-muted text-xs font-semibold text-foreground"
                >
                  {letter}
                </span>
              ))}
            </div>
            <span className="text-xs text-rail-muted">{t("heroNote")}</span>
          </div>
        </div>
        <p className="text-xs text-rail-muted">{t("footer")}</p>
      </aside>
      <main className="flex min-h-dvh flex-col p-6 md:p-12">
        <div className="flex items-center justify-between">
          <Link href="/" className="lg:invisible">
            <Brand />
          </Link>
          <PreferenceControls />
        </div>
        <div className="mx-auto my-auto w-full max-w-sm py-12">
          <p className="eyebrow">{t("tagline")}</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">
            {t(register ? "register" : "loginTitle")}
          </h2>
          <p className="subtext mt-3">
            {t(register ? "registerBody" : "loginBody")}
          </p>
          {error && (
            <p
              role="alert"
              className="mt-5 rounded-xl bg-danger-soft p-3 text-sm text-danger"
            >
              {t(error)}
            </p>
          )}
          <form onSubmit={submit} className="mt-8 space-y-5">
            {register && (
              <label className="block">
                <span className="field-label">{t("name")}</span>
                <input
                  name="name"
                  autoComplete="name"
                  className="field"
                  required
                  maxLength={100}
                />
              </label>
            )}
            <label className="block">
              <span className="field-label">{t("email")}</span>
              <input
                name="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                autoComplete="email"
                className="field"
                required
                maxLength={254}
              />
            </label>
            <label className="block">
              <span className="field-label">{t("password")}</span>
              <div className="relative">
                <input
                  name="password"
                  type={visible ? "text" : "password"}
                  autoComplete={register ? "new-password" : "current-password"}
                  className="field pr-12"
                  required
                  minLength={register ? 12 : 1}
                  maxLength={128}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-secondary"
                  aria-label={t(visible ? "hidePassword" : "showPassword")}
                  title={t(visible ? "hidePassword" : "showPassword")}
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {register && (
                <span className="mt-2 block text-xs text-secondary">
                  {t("passwordHint")}
                </span>
              )}
            </label>
            {register && (
              <label className="block">
                <span className="field-label">{t("accountType")}</span>
                <select name="account_type" className="field">
                  <option value="personal">{t("personal")}</option>
                  <option value="family">{t("family")}</option>
                  <option value="company">{t("company")}</option>
                </select>
              </label>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? t("processing") : t(register ? "register" : "signIn")}
              <ArrowRight size={17} />
            </Button>
          </form>
          {!register && (
            <PasskeySignIn
              email={email}
              onSuccess={() => router.push("/workspace")}
            />
          )}
          <p className="mt-5 text-center text-sm text-secondary">
            {t(register ? "haveAccount" : "noAccount")}{" "}
            <button
              type="button"
              onClick={() => {
                setRegister(!register);
                setError(null);
              }}
              className="font-semibold text-foreground underline underline-offset-4"
            >
              {t(register ? "signIn" : "register")}
            </button>
          </p>
          <div className="my-7 h-px bg-border" />
          <Button
            variant="secondary"
            className="w-full"
            disabled={pending}
            onClick={() => authenticate("/auth/demo", {})}
          >
            {t("demoLogin")}
            <ArrowRight size={16} />
          </Button>
          <div className="mt-3">
            <DemoSwitcher enabled />
          </div>
          <p className="mt-3 text-center text-xs leading-5 text-secondary">
            {t("demoHint")} {t("consentDemo")}
          </p>
          <p className="mt-8 flex items-center justify-center gap-2 text-xs text-secondary">
            <LockKeyhole size={13} />
            {t("authPrivacy")}
          </p>
        </div>
      </main>
    </div>
  );
}
