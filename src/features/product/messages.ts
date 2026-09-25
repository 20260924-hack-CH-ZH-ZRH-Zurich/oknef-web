import { usePreferences } from "@/features/preferences/Preferences";
import { de } from "./messages/de";
import { en } from "./messages/en";
import { es } from "./messages/es";
import { fr } from "./messages/fr";
export const productMessages = { en, es, de, fr };
export const useProductMessages = () =>
  productMessages[usePreferences().locale];
