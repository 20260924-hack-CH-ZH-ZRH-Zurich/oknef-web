import { z } from "zod";
export const documentSchema = z
  .object({
    summary: z.string().max(20000),
    fields: z
      .array(
        z
          .object({
            name: z.string().max(200),
            value: z.string().max(5000),
            confidence: z.enum(["low", "medium", "high"]),
          })
          .strict(),
      )
      .max(50),
    warnings: z.array(z.string().max(2000)).max(30),
    source: z.literal("user_upload"),
    verified_identity: z.literal(false),
    model: z.string(),
  })
  .strict();
export type DocumentReply = z.infer<typeof documentSchema>;
export const documentText = {
  en: {
    title: "Extract document details",
    upload: "Attach a document image",
    body: "This image will be sent to the configured AI provider for text extraction. Use a redacted PNG or JPEG up to 4 MB. Do not upload passwords, recovery keys, or unredacted identity documents.",
    send: "Send image for extraction",
    cancel: "Cancel",
    error: "Choose a PNG or JPEG image smaller than 4 MB.",
    working: "Reading the uploaded document…",
    notice:
      "AI extraction can be wrong. Review every field before using it. This does not verify identity or save an asset.",
    field: "Extracted fields",
    confidence: "Confidence",
    low: "Low",
    medium: "Medium",
    high: "High",
    prompt: "What details should be extracted?",
  },
  de: {
    title: "Dokumentdetails extrahieren",
    upload: "Dokumentbild anhängen",
    body: "Dieses Bild wird zur Textextraktion an den konfigurierten KI-Anbieter gesendet. Verwende ein geschwärztes PNG oder JPEG bis 4 MB. Keine Passwörter, Wiederherstellungsschlüssel oder ungeschwärzten Ausweisdokumente hochladen.",
    send: "Bild zur Extraktion senden",
    cancel: "Abbrechen",
    error: "Wähle ein PNG- oder JPEG-Bild unter 4 MB.",
    working: "Das hochgeladene Dokument wird gelesen…",
    notice:
      "KI-Extraktion kann fehlerhaft sein. Prüfe jedes Feld vor der Nutzung. Es wird weder eine Identität bestätigt noch ein Vermögenswert gespeichert.",
    field: "Extrahierte Felder",
    confidence: "Konfidenz",
    low: "Niedrig",
    medium: "Mittel",
    high: "Hoch",
    prompt: "Welche Angaben sollen extrahiert werden?",
  },
  es: {
    title: "Extraer datos del documento",
    upload: "Adjuntar imagen de documento",
    body: "Esta imagen se enviará al proveedor de IA configurado para extraer texto. Usa un PNG o JPEG con datos sensibles ocultos de hasta 4 MB. No subas contraseñas, claves de recuperación ni documentos de identidad sin ocultar.",
    send: "Enviar imagen para extracción",
    cancel: "Cancelar",
    error: "Elige una imagen PNG o JPEG de menos de 4 MB.",
    working: "Leyendo el documento subido…",
    notice:
      "La extracción por IA puede fallar. Revisa cada campo antes de usarlo. No verifica la identidad ni guarda un activo.",
    field: "Campos extraídos",
    confidence: "Confianza",
    low: "Baja",
    medium: "Media",
    high: "Alta",
    prompt: "¿Qué datos deben extraerse?",
  },
  fr: {
    title: "Extraire les détails du document",
    upload: "Joindre une image de document",
    body: "Cette image sera envoyée au fournisseur d’IA configuré pour extraire le texte. Utilisez un PNG ou JPEG expurgé de 4 Mo maximum. N’envoyez aucun mot de passe, clé de récupération ou document d’identité non expurgé.",
    send: "Envoyer l’image pour extraction",
    cancel: "Annuler",
    error: "Choisissez une image PNG ou JPEG de moins de 4 Mo.",
    working: "Lecture du document importé…",
    notice:
      "L’extraction par IA peut être erronée. Vérifiez chaque champ avant utilisation. Elle ne vérifie aucune identité et n’enregistre aucun actif.",
    field: "Champs extraits",
    confidence: "Confiance",
    low: "Faible",
    medium: "Moyenne",
    high: "Élevée",
    prompt: "Quels détails faut-il extraire ?",
  },
} as const;
