import { usePreferences } from "@/features/preferences/Preferences";
import { de } from "./messages/de";
import { en } from "./messages/en";
import { es } from "./messages/es";
import { fr } from "./messages/fr";
export type SecurityMessages = { [K in keyof typeof en]: string };
export const securityMessages = { en, es, de, fr };
export function useSecurityMessages() {
  const { locale } = usePreferences();
  return securityMessages[locale];
}
