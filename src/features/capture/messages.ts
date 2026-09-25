import { usePreferences } from "@/features/preferences/Preferences";

export const captureMessages = {
  en: {
    microphoneHandoff:
      "Starting a microphone recording ends the current voice conversation. You can start voice again after the recording.",
    photoHelp:
      "Position the document or your face in view, then capture a photo. Review it before sending it to the provider.",
    capturePhoto: "Capture photo",
    reviewFrames: "Review sampled frames",
    reviewVisual: "Review visible evidence",
    receiptConsent:
      "I authorize sending this file to Oknef to compute its fingerprint and save the reviewed text. The server does not retain the original file; this browser keeps an encrypted copy.",
    openSession: "Open saved session",
    startVideo: "Record a video",
    stopVideo: "Finish recording",
    cancel: "Cancel capture",
    videoHelp:
      "Record up to 30 seconds on this device. Then review three sampled frames with the provider. Audio is not analyzed by this video check.",
    faceHelp:
      "Use the front camera for a portrait or a short clip while slowly turning your head. Visible changes can be reviewed; this does not verify identity, liveness, or authenticity.",
    includeAudio: "Include microphone in the saved clip",
    recording: "Recording on this device",
    ready: "Evidence ready to review",
    cameraError:
      "Camera or recording unavailable. Allow device access on HTTPS, close other camera apps, or upload a file.",
    prompt: "Extra instructions (optional)",
    promptHelp:
      "Leave blank to extract visible fields and review the evidence using the default checks.",
    asset: "Add document to assets",
    assetReview:
      "Review the name and notes before saving. Only these fields are sent to Assets; the original stays in this browser when you save the evidence session. This does not issue or verify an identity credential.",
    assetName: "Document name",
    assetNotes: "Reviewed notes",
    assetConfirm:
      "I reviewed these details and want to save this document asset.",
    assetSaved: "Document asset saved",
    assetFailed: "Could not save the asset. Review the fields and try again.",
    document: "Document / passport / ID",
    face: "Face and identity review",
    passkey: "Face ID / passkey",
    passkeyHelp: "Use your device’s passkey authentication in Identity Wallet.",
    back: "All mini apps",
    result: "Extracted document details",
    verified:
      "Identity remains unverified. Review extracted values before using them.",
    video: "Video evidence",
    file: "Selected file",
    documentDefault: "Scanned document",
    saving: "Saving…",
    noRead: "Could not read this evidence. Check the file and try again.",
  },
  es: {
    microphoneHandoff:
      "Al iniciar una grabación con micrófono se termina la conversación de voz actual. Puedes iniciar otra después de grabar.",
    photoHelp:
      "Coloca el documento o tu rostro en la imagen y toma una foto. Revísala antes de enviarla al proveedor.",
    capturePhoto: "Tomar foto",
    reviewFrames: "Revisar fotogramas de muestra",
    reviewVisual: "Revisar evidencia visible",
    receiptConsent:
      "Autorizo enviar este archivo a Oknef para calcular su huella y guardar el texto revisado. El servidor no conserva el archivo original; este navegador guarda una copia cifrada.",
    openSession: "Abrir sesión guardada",
    startVideo: "Grabar un vídeo",
    stopVideo: "Terminar grabación",
    cancel: "Cancelar captura",
    videoHelp:
      "Graba hasta 30 segundos en este dispositivo. Después revisa tres fotogramas con el proveedor. Esta revisión no analiza el audio.",
    faceHelp:
      "Usa la cámara frontal para un retrato o un vídeo corto girando lentamente la cabeza. Se pueden revisar cambios visibles; no verifica identidad, prueba de vida ni autenticidad.",
    includeAudio: "Incluir micrófono en el vídeo guardado",
    recording: "Grabando en este dispositivo",
    ready: "Evidencia lista para revisar",
    cameraError:
      "Cámara o grabación no disponible. Permite el acceso al dispositivo mediante HTTPS, cierra otras aplicaciones de cámara o sube un archivo.",
    prompt: "Instrucciones adicionales (opcional)",
    promptHelp:
      "Déjalo vacío para extraer los campos visibles y revisar la evidencia con las comprobaciones predeterminadas.",
    asset: "Añadir documento a activos",
    assetReview:
      "Revisa el nombre y las notas antes de guardar. Solo estos campos se envían a Activos; el original permanece en este navegador al guardar la sesión de evidencia. No emite ni verifica una credencial de identidad.",
    assetName: "Nombre del documento",
    assetNotes: "Notas revisadas",
    assetConfirm:
      "He revisado los datos y quiero guardar este documento como activo.",
    assetSaved: "Documento guardado en activos",
    assetFailed:
      "No se pudo guardar el activo. Revisa los campos e inténtalo de nuevo.",
    document: "Documento / pasaporte / DNI",
    face: "Revisión de rostro e identidad",
    passkey: "Face ID / clave de acceso",
    passkeyHelp:
      "Usa la autenticación con clave de acceso del dispositivo en Identidad.",
    back: "Todas las mini apps",
    result: "Datos extraídos del documento",
    verified:
      "La identidad sigue sin verificar. Revisa los valores extraídos antes de utilizarlos.",
    video: "Evidencia en vídeo",
    file: "Archivo seleccionado",
    documentDefault: "Documento escaneado",
    saving: "Guardando…",
    noRead:
      "No se pudo leer esta evidencia. Revisa el archivo e inténtalo de nuevo.",
  },
  de: {
    microphoneHandoff:
      "Eine Mikrofonaufnahme beendet das aktuelle Sprachgespräch. Danach kannst du die Sprachfunktion erneut starten.",
    photoHelp:
      "Positioniere das Dokument oder dein Gesicht im Bild und mache ein Foto. Prüfe es vor dem Senden an den Anbieter.",
    capturePhoto: "Foto aufnehmen",
    reviewFrames: "Einzelbilder prüfen",
    reviewVisual: "Sichtbare Belege prüfen",
    receiptConsent:
      "Ich erlaube, diese Datei an Oknef zu senden, um ihren Hash zu berechnen und den geprüften Text zu speichern. Der Server behält die Originaldatei nicht; dieser Browser speichert eine verschlüsselte Kopie.",
    openSession: "Gespeicherte Sitzung öffnen",
    startVideo: "Video aufnehmen",
    stopVideo: "Aufnahme beenden",
    cancel: "Aufnahme abbrechen",
    videoHelp:
      "Nimm bis zu 30 Sekunden auf diesem Gerät auf. Prüfe anschließend drei Einzelbilder mit dem Anbieter. Diese Videoprüfung analysiert keinen Ton.",
    faceHelp:
      "Nutze die Frontkamera für ein Porträt oder drehe den Kopf langsam in einem kurzen Video. Sichtbare Änderungen können geprüft werden; Identität, Lebendigkeit und Echtheit werden nicht bestätigt.",
    includeAudio: "Mikrofon im gespeicherten Video aufnehmen",
    recording: "Aufnahme auf diesem Gerät",
    ready: "Beleg zur Prüfung bereit",
    cameraError:
      "Kamera oder Aufnahme nicht verfügbar. Erlaube Gerätezugriff über HTTPS, schließe andere Kamera-Apps oder lade eine Datei hoch.",
    prompt: "Zusätzliche Hinweise (optional)",
    promptHelp:
      "Leer lassen, um sichtbare Felder zu extrahieren und den Beleg mit den Standardprüfungen zu bewerten.",
    asset: "Dokument zu Vermögenswerten hinzufügen",
    assetReview:
      "Prüfe Name und Notizen vor dem Speichern. Nur diese Felder werden an Vermögenswerte gesendet; das Original bleibt beim Speichern der Belegsitzung in diesem Browser. Es wird kein Identitätsnachweis ausgestellt oder verifiziert.",
    assetName: "Dokumentname",
    assetNotes: "Geprüfte Notizen",
    assetConfirm:
      "Ich habe die Angaben geprüft und möchte das Dokument speichern.",
    assetSaved: "Dokument gespeichert",
    assetFailed:
      "Speichern fehlgeschlagen. Prüfe die Felder und versuche es erneut.",
    document: "Dokument / Reisepass / Ausweis",
    face: "Gesichts- und Identitätsprüfung",
    passkey: "Face ID / Passkey",
    passkeyHelp:
      "Nutze die Passkey-Anmeldung deines Geräts im Identitätsbereich.",
    back: "Alle Mini-Apps",
    result: "Extrahierte Dokumentdaten",
    verified:
      "Die Identität bleibt ungeprüft. Prüfe extrahierte Werte vor der Verwendung.",
    video: "Videobeleg",
    file: "Ausgewählte Datei",
    documentDefault: "Gescanntes Dokument",
    saving: "Wird gespeichert…",
    noRead:
      "Der Beleg konnte nicht gelesen werden. Prüfe die Datei und versuche es erneut.",
  },
  fr: {
    microphoneHandoff:
      "Démarrer un enregistrement avec le microphone termine la conversation vocale actuelle. Vous pouvez la relancer après l’enregistrement.",
    photoHelp:
      "Placez le document ou votre visage dans le cadre, puis prenez une photo. Examinez-la avant de l’envoyer au fournisseur.",
    capturePhoto: "Prendre une photo",
    reviewFrames: "Examiner les images échantillonnées",
    reviewVisual: "Examiner les éléments visibles",
    receiptConsent:
      "J’autorise l’envoi de ce fichier à Oknef pour calculer son empreinte et enregistrer le texte vérifié. Le serveur ne conserve pas l’original ; ce navigateur garde une copie chiffrée.",
    openSession: "Ouvrir la session enregistrée",
    startVideo: "Enregistrer une vidéo",
    stopVideo: "Terminer l’enregistrement",
    cancel: "Annuler la capture",
    videoHelp:
      "Enregistrez jusqu’à 30 secondes sur cet appareil. Examinez ensuite trois images avec le fournisseur. Cette vérification vidéo n’analyse pas le son.",
    faceHelp:
      "Utilisez la caméra avant pour un portrait ou un court clip en tournant lentement la tête. Les changements visibles peuvent être examinés ; cela ne vérifie ni identité, ni présence réelle, ni authenticité.",
    includeAudio: "Inclure le microphone dans le clip enregistré",
    recording: "Enregistrement sur cet appareil",
    ready: "Preuve prête à examiner",
    cameraError:
      "Caméra ou enregistrement indisponible. Autorisez l’accès sur HTTPS, fermez les autres applications utilisant la caméra ou importez un fichier.",
    prompt: "Instructions supplémentaires (facultatif)",
    promptHelp:
      "Laissez vide pour extraire les champs visibles et examiner la preuve avec les contrôles par défaut.",
    asset: "Ajouter le document aux actifs",
    assetReview:
      "Vérifiez le nom et les notes avant d’enregistrer. Seuls ces champs sont envoyés aux Actifs ; l’original reste dans ce navigateur lors de l’enregistrement de la session de preuve. Aucun justificatif d’identité n’est émis ni vérifié.",
    assetName: "Nom du document",
    assetNotes: "Notes vérifiées",
    assetConfirm:
      "J’ai vérifié ces informations et souhaite enregistrer ce document comme actif.",
    assetSaved: "Document enregistré dans les actifs",
    assetFailed:
      "Impossible d’enregistrer l’actif. Vérifiez les champs et réessayez.",
    document: "Document / passeport / carte d’identité",
    face: "Examen du visage et de l’identité",
    passkey: "Face ID / clé d’accès",
    passkeyHelp:
      "Utilisez l’authentification par clé d’accès de votre appareil dans Identité.",
    back: "Toutes les mini-apps",
    result: "Données extraites du document",
    verified:
      "L’identité reste non vérifiée. Vérifiez les valeurs extraites avant utilisation.",
    video: "Preuve vidéo",
    file: "Fichier sélectionné",
    documentDefault: "Document numérisé",
    saving: "Enregistrement…",
    noRead:
      "Impossible de lire cette preuve. Vérifiez le fichier et réessayez.",
  },
} as const;

export function useCaptureMessages() {
  return captureMessages[usePreferences().locale];
}
