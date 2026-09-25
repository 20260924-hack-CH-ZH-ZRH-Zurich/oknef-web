import type { Locale } from "@/features/preferences/Preferences";
import type { Slide } from "./types";
// User-supplied pitch resources are editorial content, not service configuration.
export const deckResources = {
  video:
    "https://player.vimeo.com/video/1230180083?autoplay=1&muted=1&autopause=0&dnt=1",
  videoPage: "https://vimeo.com/1230180083",
  repositories:
    "https://github.com/orgs/20260924-hack-CH-ZH-ZRH-Zurich/repositories",
} as const;
const content = {
  en: {
    video: "Watch Oknef in action",
    videoBody:
      "The recorded product walkthrough. Audio starts muted; use the player controls to listen. If Vimeo requests access, open the video on Vimeo.",
    videoLink: "Open on Vimeo",
    repos: "Inspect the implementation",
    reposBody:
      "Explore the independent repositories for the web, native apps, browser extension, services, AI and infrastructure.",
    button: "Open the repositories",
  },
  es: {
    video: "Mira Oknef en acción",
    videoBody:
      "Demostración grabada del producto. Empieza sin sonido; usa los controles para escucharlo. Si Vimeo solicita acceso, abre el vídeo en Vimeo.",
    videoLink: "Abrir en Vimeo",
    repos: "Inspecciona la implementación",
    reposBody:
      "Explora los repositorios independientes de la web, apps nativas, extensión, servicios, IA e infraestructura.",
    button: "Abrir los repositorios",
  },
  de: {
    video: "Oknef in Aktion ansehen",
    videoBody:
      "Aufgezeichnete Produktvorführung. Der Ton startet stumm; mit den Steuerelementen aktivieren. Wenn Vimeo Zugriff verlangt, öffne das Video auf Vimeo.",
    videoLink: "Auf Vimeo öffnen",
    repos: "Implementierung prüfen",
    reposBody:
      "Die unabhängigen Repositories für Web, native Apps, Erweiterung, Dienste, KI und Infrastruktur ansehen.",
    button: "Repositories öffnen",
  },
  fr: {
    video: "Voir Oknef en action",
    videoBody:
      "Démonstration enregistrée. Le son démarre coupé ; activez-le dans les commandes du lecteur. Si Vimeo demande un accès, ouvrez la vidéo sur Vimeo.",
    videoLink: "Ouvrir sur Vimeo",
    repos: "Examiner l’implémentation",
    reposBody:
      "Explorez les dépôts indépendants du web, des applications natives, de l’extension, des services, de l’IA et de l’infrastructure.",
    button: "Ouvrir les dépôts",
  },
};
export function resourceSlides(locale: Locale): Slide[] {
  const m = content[locale];
  return [
    {
      label: "VIDEO",
      title: m.video,
      body: m.videoBody,
      cards: [],
      video: true,
      videoLinkLabel: m.videoLink,
    },
    {
      label: "REPOSITORIES",
      title: m.repos,
      body: m.reposBody,
      cards: [],
      repositoryLabel: m.button,
    },
  ];
}
