import type { Locale } from "@/lib/locales";
import type { Slide } from "./types";

const guideCopy = {
  en: {
    label: "How it works",
    caption: "Oknef architecture explanation · implementation boundaries shown",
    encryption: [
      "A file keeps\nits secrets locally.",
      "The user creates a recipient identity, protects the file on their device and stores the envelope. Recovery requires the separate private key. The experimental format has no independent audit.",
    ],
    topology: [
      "A register that grows\nwith your records.",
      "Each submitted asset, member, plan and evidence session adds context. A recorded relationship is not proof of account ownership, live compromise or network discovery.",
    ],
    succession: [
      "Prepare the decision.\nPreserve the safeguards.",
      "People define intentions, choose reviewers and document their decisions. Legal authority, provider acceptance, death verification and key recovery remain separate processes.",
    ],
    tenants: [
      "Personal. Family. Company.\nOne clear boundary.",
      "Switch only to a workspace you belong to. Metadata and evidence are scoped to that workspace; vault and local-file secrets have separate encryption boundaries.",
    ],
  },
  es: {
    label: "Cómo funciona",
    caption: "Arquitectura de Oknef · límites de implementación visibles",
    encryption: [
      "El archivo conserva\nsus secretos localmente.",
      "El usuario crea una identidad de destinatario, cifra el archivo en su dispositivo y guarda el contenedor. Recuperarlo requiere la clave privada separada. El formato experimental no tiene auditoría independiente.",
    ],
    topology: [
      "Un registro que crece\ncon tus datos.",
      "Cada activo, miembro, plan y sesión añade contexto. Una relación registrada no demuestra propiedad, compromiso activo ni descubrimiento de red.",
    ],
    succession: [
      "Prepara la decisión.\nConserva las garantías.",
      "Las personas definen intenciones, eligen revisores y documentan decisiones. Autoridad legal, aceptación del proveedor, verificación del fallecimiento y recuperación de claves siguen procesos separados.",
    ],
    tenants: [
      "Personal. Familia. Empresa.\nUn límite claro.",
      "Cambia solo a espacios a los que perteneces. Los metadatos y pruebas se limitan a ese espacio; la bóveda y los archivos locales tienen límites de cifrado independientes.",
    ],
  },
  de: {
    label: "So funktioniert es",
    caption: "Oknef-Architektur · Implementierungsgrenzen dargestellt",
    encryption: [
      "Dateigeheimnisse\nbleiben lokal.",
      "Der Nutzer erstellt eine Empfängeridentität, verschlüsselt auf dem Gerät und speichert die Hülle. Wiederherstellung erfordert den separaten privaten Schlüssel. Das experimentelle Format ist nicht unabhängig geprüft.",
    ],
    topology: [
      "Ein Register wächst\nmit deinen Datensätzen.",
      "Jeder Vermögenswert, jedes Mitglied, jeder Plan und Nachweis ergänzt den Zusammenhang. Eine erfasste Beziehung beweist weder Eigentum noch laufende Kompromittierung oder Netzwerkentdeckung.",
    ],
    succession: [
      "Entscheidungen vorbereiten.\nSchutzvorkehrungen bewahren.",
      "Menschen definieren Absichten, wählen Prüfer und dokumentieren Entscheidungen. Rechtliche Befugnis, Anbieterakzeptanz, Todesprüfung und Schlüsselwiederherstellung sind separate Prozesse.",
    ],
    tenants: [
      "Privat. Familie. Unternehmen.\nEine klare Grenze.",
      "Wechsle nur in Arbeitsbereiche, denen du angehörst. Metadaten und Nachweise gehören zu diesem Bereich; Tresor und lokale Dateien haben separate Verschlüsselungsgrenzen.",
    ],
  },
  fr: {
    label: "Fonctionnement",
    caption: "Architecture d’Oknef · limites de l’implémentation indiquées",
    encryption: [
      "Les secrets du fichier\nrestent locaux.",
      "L’utilisateur crée une identité de destinataire, chiffre sur son appareil et conserve l’enveloppe. La récupération exige la clé privée séparée. Le format expérimental n’a pas d’audit indépendant.",
    ],
    topology: [
      "Un registre qui grandit\navec vos dossiers.",
      "Chaque actif, membre, plan et session enrichit le contexte. Un lien enregistré ne prouve ni propriété, compromission active ou découverte réseau.",
    ],
    succession: [
      "Préparer la décision.\nPréserver les garanties.",
      "Les personnes définissent leurs intentions, choisissent des réviseurs et documentent leurs décisions. Autorité juridique, acceptation du fournisseur, vérification du décès et récupération des clés restent distinctes.",
    ],
    tenants: [
      "Personnel. Famille. Entreprise.\nUne frontière claire.",
      "Ne passez qu’aux espaces dont vous êtes membre. Métadonnées et preuves sont limitées à cet espace ; coffre et fichiers locaux ont des frontières de chiffrement distinctes.",
    ],
  },
};
export function guideSlides(locale: Locale): Slide[] {
  const text = guideCopy[locale];
  return (["encryption", "topology", "succession", "tenants"] as const).map(
    (topic) => ({
      label: text.label,
      title: text[topic][0],
      body: text[topic][1],
      cards: [],
      media: {
        src: `/guides/${topic}-${locale}.svg`,
        alt: text[topic][0].replaceAll("\n", " "),
        caption: text.caption,
      },
    }),
  );
}
