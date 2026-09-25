import type { Locale } from "@/lib/locales";
import type { Slide } from "./types";

const content: Record<Locale, [Slide, Slide, Slide]> = {
  en: [
    {
      label: "Capture to inventory",
      title: "Review the source.\nKeep the connection.",
      body: "Choose a document or capture media, review the extracted fields and explicitly save an asset linked to its evidence session. The server checks the received bytes with SHA-256. That receipt proves neither source authenticity nor identity; the original can remain encrypted in this browser.",
      cards: [],
      media: {
        src: "/deck-assets/capture-document.png",
        alt: "Actual document mini app showing a saved synthetic document asset",
        caption:
          "Actual local interface · synthetic document with live model OCR · English capture · no physical camera or identity proof",
      },
    },
    {
      label: "Authenticator vault",
      title: "Your authenticator.\nYour local vault key.",
      body: "A compatible authenticator can protect the vault key through WebAuthn PRF, HKDF and AES-256-GCM. Its PIN or supported biometric confirms access. Keep the separate recovery key: camera checks never unlock the vault, and unsupported PRF stops enrollment.",
      cards: [],
      media: {
        src: "/diagrams/live-capture/vault-en.svg",
        alt: "Authenticator PRF derives a key that wraps the local vault recovery key",
        caption:
          "Implemented key flow · origin and owner binding · physical authenticator acceptance and independent security audit remain separate",
      },
    },
    {
      label: "Extension workspace",
      title: "Open the workspace\ninside the extension.",
      body: "The packaged full-tab interface includes Drive, connected assets, sessions, mini apps and conversations. Local inspectors stay available in the popup. Authenticated requests use the configured Oknef origin; camera and microphone access remain explicit. Use the trusted website for unsupported authenticator operations.",
      cards: [],
      media: {
        src: "/deck-assets/extension-workspace.png",
        alt: "Actual packaged extension workspace with the QR mini app open",
        caption:
          "Actual unpacked extension · controlled demo records · English capture · manual installation; store release and physical media acceptance remain separate",
      },
    },
  ],
  es: [
    {
      label: "De captura a inventario",
      title: "Revisa el origen.\nConserva la conexión.",
      body: "Elige un documento o captura contenido, revisa los campos extraídos y guarda expresamente un activo vinculado a su sesión. El servidor comprueba los bytes recibidos con SHA-256. Ese recibo no prueba autenticidad ni identidad; el original puede permanecer cifrado en este navegador.",
      cards: [],
      media: {
        src: "/deck-assets/capture-document.png",
        alt: "Mini app real con un documento sintético guardado como activo",
        caption:
          "Interfaz local real · documento sintético con OCR de un modelo en vivo · captura en inglés · sin cámara física ni prueba de identidad",
      },
    },
    {
      label: "Bóveda con autenticador",
      title: "Tu autenticador.\nTu clave local.",
      body: "Un autenticador compatible puede proteger la clave mediante WebAuthn PRF, HKDF y AES-256-GCM. Su PIN o biometría admitida confirma el acceso. Conserva la clave de recuperación aparte: la cámara nunca desbloquea la bóveda y, sin PRF, el registro se detiene.",
      cards: [],
      media: {
        src: "/diagrams/live-capture/vault-es.svg",
        alt: "PRF deriva una clave que protege la clave local de recuperación",
        caption:
          "Flujo de claves implementado · vínculo al origen y titular · aceptación del autenticador físico y auditoría independiente por separado",
      },
    },
    {
      label: "Espacio en la extensión",
      title: "Abre el espacio\ndentro de la extensión.",
      body: "La interfaz empaquetada en una pestaña incluye Drive, activos conectados, sesiones, mini apps y conversaciones. La ventana emergente conserva los inspectores locales. Las peticiones autenticadas usan el origen Oknef configurado; cámara y micrófono exigen permiso explícito. Para autenticadores no admitidos, usa la web de confianza.",
      cards: [],
      media: {
        src: "/deck-assets/extension-workspace.png",
        alt: "Espacio real de la extensión empaquetada con la mini app QR abierta",
        caption:
          "Extensión desempaquetada real · datos de demo controlados · captura en inglés · instalación manual; publicación en tienda y medios físicos por separado",
      },
    },
  ],
  de: [
    {
      label: "Von der Aufnahme zum Inventar",
      title: "Die Quelle prüfen.\nDen Zusammenhang erhalten.",
      body: "Dokument wählen oder Medien aufnehmen, extrahierte Felder prüfen und einen Eintrag mit Verweis auf die Nachweissitzung bewusst speichern. Der Server prüft empfangene Bytes mit SHA-256. Dieser Beleg beweist weder Echtheit noch Identität; das Original kann verschlüsselt im Browser bleiben.",
      cards: [],
      media: {
        src: "/deck-assets/capture-document.png",
        alt: "Tatsächliche Dokument-Mini-App mit gespeichertem synthetischem Dokument",
        caption:
          "Tatsächliche lokale Oberfläche · synthetisches Dokument mit Live-Modell-OCR · englische Aufnahme · keine physische Kamera oder Identitätsprüfung",
      },
    },
    {
      label: "Tresor mit Authentifikator",
      title: "Dein Authentifikator.\nDein lokaler Schlüssel.",
      body: "Ein kompatibler Authentifikator kann den Tresorschlüssel durch WebAuthn PRF, HKDF und AES-256-GCM schützen. PIN oder unterstützte Biometrie bestätigen den Zugriff. Den Wiederherstellungsschlüssel getrennt aufbewahren: Kameraprüfungen entsperren keinen Tresor; ohne PRF endet die Einrichtung.",
      cards: [],
      media: {
        src: "/diagrams/live-capture/vault-de.svg",
        alt: "PRF leitet einen Schlüssel zur lokalen Verschlüsselung des Wiederherstellungsschlüssels ab",
        caption:
          "Implementierter Schlüsselfluss · Bindung an Ursprung und Inhaber · physischer Authentifikatortest und unabhängige Sicherheitsprüfung separat",
      },
    },
    {
      label: "Arbeitsbereich in der Erweiterung",
      title: "Den Arbeitsbereich\nin der Erweiterung öffnen.",
      body: "Die gebündelte Vollansicht enthält Drive, verknüpfte Einträge, Sitzungen, Mini-Apps und Gespräche. Lokale Prüfer bleiben im Popup. Authentifizierte Anfragen nutzen den konfigurierten Oknef-Ursprung; Kamera und Mikrofon verlangen eine bewusste Freigabe. Nicht unterstützte Authentifikatoraktionen erfolgen auf der vertrauenswürdigen Website.",
      cards: [],
      media: {
        src: "/deck-assets/extension-workspace.png",
        alt: "Tatsächliche gebündelte Erweiterung mit geöffneter QR-Mini-App",
        caption:
          "Tatsächliche entpackte Erweiterung · kontrollierte Demodatensätze · englische Aufnahme · manuelle Installation; Store-Freigabe und physische Medienprüfung separat",
      },
    },
  ],
  fr: [
    {
      label: "De la capture à l’inventaire",
      title: "Examiner la source.\nConserver le lien.",
      body: "Choisir un document ou capturer un média, vérifier les champs extraits, puis enregistrer explicitement un actif lié à sa session. Le serveur vérifie les octets reçus avec SHA-256. Ce reçu ne prouve ni authenticité ni identité ; l’original peut rester chiffré dans ce navigateur.",
      cards: [],
      media: {
        src: "/deck-assets/capture-document.png",
        alt: "Mini app réelle montrant un document synthétique enregistré comme actif",
        caption:
          "Interface locale réelle · document synthétique avec OCR par modèle en direct · capture en anglais · sans caméra physique ni preuve d’identité",
      },
    },
    {
      label: "Coffre avec authentificateur",
      title: "Votre authentificateur.\nVotre clé locale.",
      body: "Un authentificateur compatible peut protéger la clé via WebAuthn PRF, HKDF et AES-256-GCM. Son code PIN ou sa biométrie prise en charge confirme l’accès. Gardez la clé de récupération à part : la caméra ne déverrouille jamais le coffre et, sans PRF, la configuration s’arrête.",
      cards: [],
      media: {
        src: "/diagrams/live-capture/vault-fr.svg",
        alt: "PRF dérive une clé qui enveloppe localement la clé de récupération du coffre",
        caption:
          "Flux de clés implémenté · liaison à l’origine et au titulaire · validation physique de l’authentificateur et audit indépendant séparés",
      },
    },
    {
      label: "Espace dans l’extension",
      title: "Ouvrir l’espace\ndans l’extension.",
      body: "L’interface complète empaquetée inclut Drive, actifs liés, sessions, mini apps et conversations. Les inspecteurs locaux restent dans la fenêtre contextuelle. Les requêtes authentifiées utilisent l’origine Oknef configurée ; caméra et microphone demandent un accord explicite. Utilisez le site de confiance pour les opérations d’authentificateur non prises en charge.",
      cards: [],
      media: {
        src: "/deck-assets/extension-workspace.png",
        alt: "Espace réel de l’extension empaquetée avec la mini app QR ouverte",
        caption:
          "Extension décompressée réelle · données de démonstration contrôlées · capture en anglais · installation manuelle ; publication en magasin et validation physique séparées",
      },
    },
  ],
};

export function liveCaptureSlides(locale: Locale): Slide[] {
  return content[locale];
}
