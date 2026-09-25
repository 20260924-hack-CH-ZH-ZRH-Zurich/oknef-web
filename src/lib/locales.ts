export const locales = ["en", "es", "de", "fr"] as const;
export type Locale = (typeof locales)[number];

export function localizedPath(pathname: string) {
  const match = /^\/(en|es|de|fr)(?=\/|$)(.*)$/.exec(pathname);
  if (!match) return null;
  return { locale: match[1] as Locale, pathname: match[2] || "/" };
}
