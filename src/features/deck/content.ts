import type { Locale } from "@/features/preferences/Preferences";
import { de } from "./content/de";
import { en } from "./content/en";
import { es } from "./content/es";
import { fr } from "./content/fr";
import { expansionSlides } from "./expansion";
import { guideSlides } from "./guides";
import { liveCaptureSlides } from "./liveCapture";
import { resourceSlides } from "./resources";
import type { Slide } from "./types";

function withExpansion(locale: Locale, original: Slide[]): Slide[] {
  return [
    ...original.slice(0, 4),
    ...expansionSlides(locale),
    ...liveCaptureSlides(locale),
    ...guideSlides(locale),
    ...original.slice(4),
    ...resourceSlides(locale),
  ].map((slide, index) => ({
    ...slide,
    label: `${String(index + 1).padStart(2, "0")} / ${slide.label.replace(/^\d+ \/ /, "")}`,
  }));
}
export const slides: Record<Locale, Slide[]> = {
  en: withExpansion("en", en),
  de: withExpansion("de", de),
  es: withExpansion("es", es),
  fr: withExpansion("fr", fr),
};
