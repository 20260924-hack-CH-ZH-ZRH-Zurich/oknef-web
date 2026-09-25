import type { Locale } from "@/lib/locales";

export const liveCaptureLabels: Record<
  Locale,
  { capture: string; vault: string }
> = {
  en: {
    capture: "Capture, receipt and linked inventory",
    vault: "Authenticator-assisted local vault unlocking",
  },
  es: {
    capture: "Captura, recibo e inventario vinculado",
    vault: "Desbloqueo local con ayuda del autenticador",
  },
  de: {
    capture: "Aufnahme, Empfangsbeleg und verknüpftes Inventar",
    vault: "Lokaler Tresorzugriff mit Authentifikator",
  },
  fr: {
    capture: "Capture, reçu et inventaire lié",
    vault: "Déverrouillage local avec un authentificateur",
  },
};
