import type { Locale } from "@/lib/locales";
import type { Slide } from "./types";

const captions: Record<Locale, string> = {
  en: "Actual Oknef interface · controlled QA records · English capture",
  es: "Interfaz real de Oknef · registros de prueba controlados · captura en inglés",
  de: "Tatsächliche Oknef-Oberfläche · kontrollierte Testdatensätze · englische Aufnahme",
  fr: "Interface réelle d’Oknef · dossiers de test contrôlés · capture en anglais",
};
const content: Record<
  Locale,
  { label: string; title: string; body: string; image: string }[]
> = {
  en: [
    {
      label: "Browser companion",
      title: "Pause before\nyou follow the link.",
      body: "Inspect a link or selected text with the local Manifest V3 extension. Rule findings stay on the device until the user chooses to send evidence to Oknef. The installable package is available for manual browser installation; store publication remains separate.",
      image: "extension-popup",
    },
    {
      label: "Security sessions",
      title: "One QR.\nOne explainable decision.",
      body: "Decode a QR image locally, review the destination and save the evidence. Rules surface potential risk signals; each session keeps its explanation and follow-up questions. No link opens automatically.",
      image: "security-qr",
    },
    {
      label: "Shared decisions",
      title: "Two reviewers.\nA decision you can trace.",
      body: "Bind invitations to an email and an account ID confirmed through a trusted channel. Accepted reviewers record independent decisions in a visible workflow. Approval never moves money or releases keys.",
      image: "approvals-decision",
    },
    {
      label: "Local encryption",
      title: "Protection starts\non your device.",
      body: "The experimental .oknefq envelope uses X-Wing (ML-KEM-768 + X25519), HKDF and AES-256-GCM. Encryption and decryption run locally. This implementation has no independent audit and does not protect a compromised device.",
      image: "file-protection",
    },
    {
      label: "Connected inventory",
      title: "Every connection\nhas a source.",
      body: "Explore the assets, people, succession plans and evidence actually stored in your workspace. The topology makes relationships understandable without pretending to discover accounts or monitor devices.",
      image: "asset-topology",
    },
    {
      label: "Learning",
      title: "Practice before\nthe pressure.",
      body: "Rehearse phishing, instruction injection, voice impersonation and honeytoken scenarios. Every exercise is labeled and isolated. Practice never adds a real fraud detection or deploys an external trap.",
      image: "security-learning",
    },
    {
      label: "Evidence metrics",
      title: "Measure the evidence\nyou have.",
      body: "The forensic lab shows which internal evidence categories contain records. ISO/IEC 30107 and FINMA assessments remain unperformed. Coverage is a review aid, not a certification or detector benchmark.",
      image: "forensic-lab",
    },
    {
      label: "Agent operations",
      title: "Review together.\nKeep authority human.",
      body: "Choose bounded specialist reviews for inventory, identity, email, QR, calls, documents, recovery, policy and practice. A verifier checks findings. Provider calls go through the Rust AI core; agents receive no provider API key or execution tools.",
      image: "agent-operations",
    },
  ],
  es: [
    {
      label: "Compañero del navegador",
      title: "Una pausa antes\nde seguir el enlace.",
      body: "Inspecciona enlaces o texto con la extensión local Manifest V3. Los resultados permanecen en el dispositivo hasta que el usuario decide enviarlos a Oknef. El paquete permite instalación manual; la publicación en tienda es independiente.",
      image: "extension-popup",
    },
    {
      label: "Sesiones de seguridad",
      title: "Un QR.\nUna decisión explicable.",
      body: "Decodifica una imagen QR localmente, revisa el destino y guarda las pruebas. Las reglas señalan posibles riesgos; cada sesión conserva su explicación y preguntas. Ningún enlace se abre automáticamente.",
      image: "security-qr",
    },
    {
      label: "Decisiones compartidas",
      title: "Dos revisores.\nUna decisión trazable.",
      body: "Vincula la invitación a un correo y a un identificador confirmado por un canal de confianza. Los revisores aceptados registran decisiones independientes en un flujo visible. La aprobación no mueve dinero ni libera claves.",
      image: "approvals-decision",
    },
    {
      label: "Cifrado local",
      title: "La protección empieza\nen tu dispositivo.",
      body: "El formato experimental .oknefq utiliza X-Wing (ML-KEM-768 + X25519), HKDF y AES-256-GCM. Cifra y descifra localmente. Esta implementación no tiene auditoría independiente ni protege un dispositivo comprometido.",
      image: "file-protection",
    },
    {
      label: "Inventario conectado",
      title: "Cada conexión\ntiene una fuente.",
      body: "Explora activos, personas, planes sucesorios y pruebas guardados en tu espacio. La topología aclara las relaciones sin afirmar que descubre cuentas o supervisa dispositivos.",
      image: "asset-topology",
    },
    {
      label: "Aprendizaje",
      title: "Practica antes\nde la presión.",
      body: "Ensaya suplantación, inyección de instrucciones, imitación de voz y señuelos. Cada ejercicio está identificado y aislado. La práctica no añade detecciones reales ni despliega trampas externas.",
      image: "security-learning",
    },
    {
      label: "Métricas de pruebas",
      title: "Mide las pruebas\nque tienes.",
      body: "El laboratorio muestra qué categorías internas contienen registros. Las evaluaciones ISO/IEC 30107 y FINMA siguen pendientes. La cobertura ayuda a revisar; no es certificación ni evaluación de precisión.",
      image: "forensic-lab",
    },
    {
      label: "Operaciones de agentes",
      title: "Revisión en equipo.\nAutoridad humana.",
      body: "Elige revisiones acotadas de inventario, identidad, correo, QR, llamadas, documentos, recuperación, políticas y práctica. Un verificador revisa los resultados. Las llamadas pasan por el núcleo Rust; los agentes no reciben claves del proveedor ni herramientas de ejecución.",
      image: "agent-operations",
    },
  ],
  de: [
    {
      label: "Browser-Begleiter",
      title: "Vor dem Öffnen\nkurz innehalten.",
      body: "Links und ausgewählten Text mit der lokalen Manifest-V3-Erweiterung prüfen. Ergebnisse bleiben auf dem Gerät, bis der Nutzer sie an Oknef sendet. Das Paket wird manuell installiert; eine Store-Veröffentlichung steht separat aus.",
      image: "extension-popup",
    },
    {
      label: "Sicherheitssitzungen",
      title: "Ein QR-Code.\nEine erklärbare Entscheidung.",
      body: "Ein QR-Bild lokal erkennen, das Ziel prüfen und Nachweise speichern. Regeln zeigen mögliche Risiken; jede Sitzung bewahrt Erklärung und Folgefragen. Kein Link wird automatisch geöffnet.",
      image: "security-qr",
    },
    {
      label: "Gemeinsame Entscheidungen",
      title: "Zwei Prüfer.\nEine nachvollziehbare Entscheidung.",
      body: "Einladungen an E-Mail und eine vertrauenswürdig bestätigte Konto-ID binden. Aufgenommene Prüfer erfassen unabhängige Entscheidungen im sichtbaren Ablauf. Freigaben bewegen weder Geld noch Schlüssel.",
      image: "approvals-decision",
    },
    {
      label: "Lokale Verschlüsselung",
      title: "Schutz beginnt\nauf deinem Gerät.",
      body: "Das experimentelle .oknefq-Format verwendet X-Wing (ML-KEM-768 + X25519), HKDF und AES-256-GCM. Ver- und Entschlüsselung erfolgen lokal. Keine unabhängige Sicherheitsprüfung liegt vor; kompromittierte Geräte werden nicht geschützt.",
      image: "file-protection",
    },
    {
      label: "Verbundenes Inventar",
      title: "Jede Verbindung\nhat eine Quelle.",
      body: "Erkunde gespeicherte Vermögenswerte, Personen, Nachfolgepläne und Nachweise. Die Topologie erklärt Beziehungen, ohne Kontenentdeckung oder Geräteüberwachung vorzutäuschen.",
      image: "asset-topology",
    },
    {
      label: "Lernen",
      title: "Üben, bevor\nDruck entsteht.",
      body: "Phishing, Anweisungsinjektion, Stimmen-Imitation und Köderszenarien üben. Jede Übung ist gekennzeichnet und isoliert. Sie erzeugt keine echte Betrugserkennung und installiert keine externe Falle.",
      image: "security-learning",
    },
    {
      label: "Nachweismetriken",
      title: "Die vorhandenen\nNachweise messen.",
      body: "Das Forensiklabor zeigt interne Kategorien mit gespeicherten Nachweisen. ISO/IEC-30107- und FINMA-Bewertungen stehen aus. Abdeckung unterstützt die Prüfung und ist keine Zertifizierung oder Genauigkeitsmessung.",
      image: "forensic-lab",
    },
    {
      label: "Agentenbetrieb",
      title: "Gemeinsam prüfen.\nMenschen entscheiden.",
      body: "Begrenzte Fachprüfungen für Inventar, Identität, E-Mail, QR, Anrufe, Dokumente, Wiederherstellung, Richtlinien und Übungen wählen. Ein Verifizierer prüft Ergebnisse. Anbieteraufrufe laufen über den Rust-Kern; Agenten erhalten keine Anbieterschlüssel oder Ausführungswerkzeuge.",
      image: "agent-operations",
    },
  ],
  fr: [
    {
      label: "Compagnon du navigateur",
      title: "Une pause avant\nde suivre le lien.",
      body: "Examinez les liens et sélections avec l’extension locale Manifest V3. Les résultats restent sur l’appareil jusqu’à l’envoi choisi par l’utilisateur. Le paquet est installable manuellement ; la publication en boutique reste distincte.",
      image: "extension-popup",
    },
    {
      label: "Sessions de sécurité",
      title: "Un QR.\nUne décision explicable.",
      body: "Décodez une image QR localement, examinez la destination et conservez les preuves. Les règles signalent des risques possibles ; chaque session garde son explication et ses questions. Aucun lien ne s’ouvre automatiquement.",
      image: "security-qr",
    },
    {
      label: "Décisions partagées",
      title: "Deux réviseurs.\nUne décision traçable.",
      body: "Liez les invitations à un e-mail et à un identifiant confirmé par un canal fiable. Les réviseurs acceptés enregistrent leurs décisions indépendantes dans un parcours visible. Aucune approbation ne transfère d’argent ou de clés.",
      image: "approvals-decision",
    },
    {
      label: "Chiffrement local",
      title: "La protection commence\nsur votre appareil.",
      body: "Le format expérimental .oknefq utilise X-Wing (ML-KEM-768 + X25519), HKDF et AES-256-GCM. Chiffrement et déchiffrement sont locaux. Aucun audit indépendant n’a été effectué ; un appareil compromis n’est pas protégé.",
      image: "file-protection",
    },
    {
      label: "Inventaire connecté",
      title: "Chaque lien\na une source.",
      body: "Explorez les actifs, personnes, plans successoraux et preuves enregistrés. La topologie explique les relations sans prétendre découvrir des comptes ou surveiller des appareils.",
      image: "asset-topology",
    },
    {
      label: "Apprentissage",
      title: "S’entraîner avant\nla pression.",
      body: "Répétez des scénarios d’hameçonnage, d’injection, d’usurpation vocale et de leurre. Chaque exercice est identifié et isolé. Aucun exercice ne devient une fraude réelle détectée ni ne déploie un piège externe.",
      image: "security-learning",
    },
    {
      label: "Indicateurs de preuves",
      title: "Mesurer les preuves\ndisponibles.",
      body: "Le laboratoire montre les catégories internes contenant des dossiers. Les évaluations ISO/IEC 30107 et FINMA n’ont pas été réalisées. La couverture facilite l’examen ; ce n’est ni une certification ni une mesure de précision.",
      image: "forensic-lab",
    },
    {
      label: "Opérations des agents",
      title: "Examiner ensemble.\nGarder l’autorité humaine.",
      body: "Choisissez des examens délimités pour inventaire, identité, e-mail, QR, appels, documents, récupération, politiques et exercices. Un vérificateur examine les conclusions. Les appels passent par le cœur Rust ; les agents ne reçoivent ni clé du fournisseur ni outil d’exécution.",
      image: "agent-operations",
    },
  ],
};
export function expansionSlides(locale: Locale): Slide[] {
  return content[locale].map((slide) => ({
    label: slide.label,
    title: slide.title,
    body: slide.body,
    cards: [],
    media: {
      src: `/deck-assets/${slide.image}.png`,
      alt: slide.title.replaceAll("\n", " "),
      caption: captions[locale],
    },
  }));
}
