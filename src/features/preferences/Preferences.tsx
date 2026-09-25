"use client";
import { Globe2, Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { de } from "@/lib/i18n/de";
import { en, type TranslationKey } from "@/lib/i18n/en";
import { es } from "@/lib/i18n/es";
import { fr } from "@/lib/i18n/fr";
import { type Locale, localizedPath } from "@/lib/locales";

export type { Locale } from "@/lib/locales";

const languages = { en, de, es, fr };
const Context = createContext({
  locale: "en" as Locale,
  setLocale: (_: Locale) => {},
  theme: "system",
  setTheme: (_: string) => {},
  t: (key: TranslationKey): string => en[key],
});
export function Preferences({
  children,
  initialLocale = "en",
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const router = useRouter();
  function chooseLocale(next: Locale) {
    setLocale(next);
    const path =
      localizedPath(window.location.pathname)?.pathname ??
      window.location.pathname;
    router.replace(
      `/${next}${path === "/" ? "/" : path}${window.location.search}`,
    );
  }
  const [theme, setTheme] = useState("system");
  useEffect(() => {
    const saved = localStorage.getItem("oknef-language");
    const fromPath = localizedPath(window.location.pathname)?.locale;
    if (fromPath) setLocale(fromPath);
    else if (saved && saved in languages) setLocale(saved as Locale);
    const mode = localStorage.getItem("oknef-theme");
    if (mode && ["light", "dark", "system"].includes(mode)) setTheme(mode);
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = `Oknef — ${languages[locale].tagline}`;
    localStorage.setItem("oknef-language", locale);
  }, [locale]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("oknef-theme", theme);
  }, [theme]);
  return (
    <Context.Provider
      value={{
        locale,
        setLocale: chooseLocale,
        theme,
        setTheme,
        t: (key) => languages[locale][key],
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const usePreferences = () => useContext(Context);
export function PreferenceControls() {
  const { locale, setLocale, theme, setTheme, t } = usePreferences();
  return (
    <div className="flex items-center gap-2">
      <label className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-2 text-xs">
        <Globe2 size={14} aria-hidden="true" />
        <select
          aria-label={t("language")}
          title={t("languageHint")}
          className="bg-transparent outline-none"
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
        >
          <option value="en">EN</option>
          <option value="de">DE</option>
          <option value="es">ES</option>
          <option value="fr">FR</option>
        </select>
      </label>
      <button
        type="button"
        className="icon-button"
        title={t("theme")}
        aria-label={t("theme")}
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
      </button>
    </div>
  );
}
