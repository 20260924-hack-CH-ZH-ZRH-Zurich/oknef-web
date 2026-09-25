import type { Locale } from "@/lib/locales";

type Copy = {
  title: string;
  impact: string;
  mitigation: string;
  validation: string;
};
const copy: Record<Locale, Record<string, Copy>> = {
  en: {
    qr_phishing: {
      title: "QR and link phishing",
      impact: "Credential theft or redirected payments",
      mitigation:
        "Inspect the destination before opening; confirm through an independent channel.",
      validation: "Text and URL rules; no reputation or redirect lookup.",
    },
    email_impersonation: {
      title: "Email impersonation",
      impact: "Secrets disclosed through a forged request",
      mitigation:
        "Look for pressure and credential requests. Use a known contact channel.",
      validation:
        "Submitted text only; no sender authentication or mailbox connection.",
    },
    prompt_injection: {
      title: "Instructions inside evidence",
      impact: "Untrusted content tries to change an agent’s behavior",
      mitigation:
        "Treat evidence as data and retain human approval for actions.",
      validation: "Rule fixtures; submitted instructions are never executed.",
    },
    voice_impersonation: {
      title: "Voice impersonation",
      impact: "A caller pressures someone into a harmful decision",
      mitigation:
        "Review the transcript, end the call, and call back using a known number.",
      validation:
        "No audio classifier; text cannot establish whether a voice is AI.",
    },
    document_forgery: {
      title: "Document forgery",
      impact: "Altered evidence enters an identity workflow",
      mitigation:
        "Compare supplied text and request issuer or specialist review.",
      validation: "Text comparison does not authenticate a document.",
    },
    presentation_attack: {
      title: "Presentation and capture injection",
      impact: "An attacker bypasses biometric capture",
      mitigation:
        "Use trusted capture, fresh challenges and independent PAD evaluation.",
      validation: "Research path; no capture system or PAD dataset connected.",
    },
    iot_identity: {
      title: "Device and eSIM identity misuse",
      impact: "Unauthorized access to a connected device",
      mitigation:
        "Inventory device identities and obtain provider attestation.",
      validation:
        "Research path; no eSIM provisioning or attestation provider connected.",
    },
  },
  es: {
    qr_phishing: {
      title: "Suplantación por QR y enlaces",
      impact: "Robo de credenciales o desvío de pagos",
      mitigation:
        "Inspecciona el destino y confírmalo por un canal independiente.",
      validation: "Reglas de texto y URL; sin reputación ni redirecciones.",
    },
    email_impersonation: {
      title: "Suplantación por correo",
      impact: "Revelación de secretos por una solicitud falsa",
      mitigation:
        "Busca presión y peticiones de credenciales. Usa un contacto conocido.",
      validation:
        "Solo texto enviado; sin autenticar al remitente ni conectar el buzón.",
    },
    prompt_injection: {
      title: "Instrucciones dentro de las pruebas",
      impact: "Contenido no fiable intenta modificar al agente",
      mitigation:
        "Trata las pruebas como datos y conserva la aprobación humana.",
      validation:
        "Pruebas de reglas; las instrucciones enviadas nunca se ejecutan.",
    },
    voice_impersonation: {
      title: "Suplantación de voz",
      impact: "Una llamada presiona para tomar decisiones dañinas",
      mitigation:
        "Revisa la transcripción, termina la llamada y usa un número conocido.",
      validation:
        "Sin clasificador de audio; el texto no identifica una voz de IA.",
    },
    document_forgery: {
      title: "Falsificación de documentos",
      impact: "Pruebas alteradas entran en un proceso de identidad",
      mitigation:
        "Compara el texto y solicita revisión del emisor o especialista.",
      validation: "Comparar texto no autentica un documento.",
    },
    presentation_attack: {
      title: "Ataques de presentación y captura",
      impact: "Se elude la captura biométrica",
      mitigation:
        "Captura fiable, desafíos nuevos y evaluación PAD independiente.",
      validation:
        "Investigación; sin sistema de captura ni datos PAD conectados.",
    },
    iot_identity: {
      title: "Uso indebido de identidad de dispositivo y eSIM",
      impact: "Acceso no autorizado a un dispositivo conectado",
      mitigation:
        "Inventaría las identidades y solicita atestación al proveedor.",
      validation:
        "Investigación; sin aprovisionamiento eSIM ni proveedor de atestación.",
    },
  },
  de: {
    qr_phishing: {
      title: "QR- und Link-Phishing",
      impact: "Diebstahl von Zugangsdaten oder umgeleitete Zahlungen",
      mitigation: "Ziel vor dem Öffnen prüfen und unabhängig bestätigen.",
      validation:
        "Text- und URL-Regeln; keine Reputations- oder Weiterleitungsprüfung.",
    },
    email_impersonation: {
      title: "E-Mail-Identitätsmissbrauch",
      impact: "Gefälschte Anfragen führen zur Preisgabe von Geheimnissen",
      mitigation:
        "Auf Druck und Passwortanfragen achten. Bekannten Kontaktweg nutzen.",
      validation:
        "Nur übermittelter Text; keine Absenderprüfung oder Postfachverbindung.",
    },
    prompt_injection: {
      title: "Anweisungen in Nachweisen",
      impact: "Ungeprüfter Inhalt versucht Agentenverhalten zu ändern",
      mitigation:
        "Nachweise als Daten behandeln und menschliche Freigaben bewahren.",
      validation: "Regeltests; übermittelte Anweisungen werden nie ausgeführt.",
    },
    voice_impersonation: {
      title: "Stimmen-Imitation",
      impact: "Ein Anrufer drängt zu einer schädlichen Entscheidung",
      mitigation:
        "Transkript prüfen, auflegen und eine bekannte Nummer zurückrufen.",
      validation: "Kein Audioklassifikator; Text erkennt keine KI-Stimme.",
    },
    document_forgery: {
      title: "Dokumentenfälschung",
      impact: "Manipulierte Nachweise gelangen in die Identitätsprüfung",
      mitigation:
        "Text vergleichen und Aussteller oder Spezialisten prüfen lassen.",
      validation: "Textvergleich authentifiziert kein Dokument.",
    },
    presentation_attack: {
      title: "Präsentations- und Erfassungsangriffe",
      impact: "Angreifer umgehen die biometrische Erfassung",
      mitigation:
        "Vertrauenswürdige Erfassung, neue Herausforderungen und unabhängige PAD-Tests.",
      validation:
        "Forschung; kein Erfassungssystem oder PAD-Datensatz verbunden.",
    },
    iot_identity: {
      title: "Missbrauch von Geräte- und eSIM-Identitäten",
      impact: "Unberechtigter Zugriff auf vernetzte Geräte",
      mitigation:
        "Geräteidentitäten erfassen und Anbieterattestierung anfordern.",
      validation:
        "Forschung; keine eSIM-Bereitstellung oder Attestierung verbunden.",
    },
  },
  fr: {
    qr_phishing: {
      title: "Hameçonnage par QR et liens",
      impact: "Vol d’identifiants ou détournement de paiements",
      mitigation:
        "Inspecter la destination et confirmer par un canal indépendant.",
      validation:
        "Règles de texte et d’URL ; aucune réputation ou redirection vérifiée.",
    },
    email_impersonation: {
      title: "Usurpation par e-mail",
      impact: "Une fausse demande fait divulguer des secrets",
      mitigation:
        "Repérer la pression et les demandes d’identifiants. Utiliser un contact connu.",
      validation:
        "Texte transmis uniquement ; aucune authentification d’expéditeur.",
    },
    prompt_injection: {
      title: "Instructions dans les preuves",
      impact: "Un contenu non fiable tente de modifier l’agent",
      mitigation:
        "Traiter les preuves comme des données et conserver l’approbation humaine.",
      validation:
        "Tests de règles ; les instructions transmises ne sont jamais exécutées.",
    },
    voice_impersonation: {
      title: "Usurpation vocale",
      impact: "Un appel pousse à une décision préjudiciable",
      mitigation: "Examiner le texte, raccrocher et rappeler un numéro connu.",
      validation:
        "Aucun classificateur audio ; le texte ne reconnaît pas une voix IA.",
    },
    document_forgery: {
      title: "Falsification de document",
      impact: "Des preuves altérées entrent dans un parcours d’identité",
      mitigation:
        "Comparer le texte et demander l’examen de l’émetteur ou d’un spécialiste.",
      validation: "Comparer du texte n’authentifie pas un document.",
    },
    presentation_attack: {
      title: "Attaques de présentation et de capture",
      impact: "Un attaquant contourne la capture biométrique",
      mitigation:
        "Capture fiable, défis récents et évaluation PAD indépendante.",
      validation:
        "Recherche ; aucun système de capture ou jeu de données PAD connecté.",
    },
    iot_identity: {
      title: "Détournement d’identité d’appareil et eSIM",
      impact: "Accès non autorisé à un appareil connecté",
      mitigation:
        "Inventorier les identités et obtenir une attestation du fournisseur.",
      validation:
        "Recherche ; aucun fournisseur eSIM ou d’attestation connecté.",
    },
  },
};
export const catalog = (locale: Locale, id: string) => copy[locale][id];
export const controlLabels: Record<Locale, Record<string, string>> = {
  en: {
    session_traceability: "Evidence and method traceability",
    document_reference: "Document review evidence",
    pad_evaluation: "Independent PAD evaluation",
    regulatory_assessment: "Independent regulatory assessment",
  },
  es: {
    session_traceability: "Trazabilidad de pruebas y método",
    document_reference: "Pruebas de revisión documental",
    pad_evaluation: "Evaluación PAD independiente",
    regulatory_assessment: "Evaluación regulatoria independiente",
  },
  de: {
    session_traceability: "Nachweis- und Methodennachverfolgung",
    document_reference: "Nachweise der Dokumentprüfung",
    pad_evaluation: "Unabhängige PAD-Bewertung",
    regulatory_assessment: "Unabhängige regulatorische Bewertung",
  },
  fr: {
    session_traceability: "Traçabilité des preuves et méthodes",
    document_reference: "Preuves d’examen documentaire",
    pad_evaluation: "Évaluation PAD indépendante",
    regulatory_assessment: "Évaluation réglementaire indépendante",
  },
};
