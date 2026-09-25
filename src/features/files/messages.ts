export const fileMessages = {
  en: {
    title: "File protection",
    intro:
      "Encrypt a file on this device. Its name and contents stay in your browser; the protected file can be stored anywhere.",
    boundary:
      "Experimental post-quantum file format: X-Wing (ML-KEM-768 + X25519), HKDF and AES-256-GCM. This implementation has no independent security audit. It does not verify the sender or protect a compromised device.",
    create: "Create a recipient identity",
    recipient: "Recipient public key",
    fingerprint:
      "Compare this fingerprint with your recipient using a trusted channel.",
    recovery: "Private recovery key",
    export: "Download private recovery key",
    keyWarning:
      "Keep this key offline and separate from protected files. Anyone holding it can decrypt your files. Oknef cannot recover a lost key.",
    file: "Choose a file (up to 2 MiB)",
    protect: "Encrypt and download .oknefq",
    open: "Decrypt and download original",
    protectedFile: "Choose a protected .oknefq file",
    acknowledge: "I have safely saved my private recovery key.",
    failed:
      "The file or key could not be used. Check the recipient, format and size; modified files cannot be opened.",
    done: "Download created on this device.",
    busy: "Processing locally…",
    clear: "Clear keys",
    share:
      "Share only the public recipient key. Confirm its fingerprint before encrypting for someone else.",
  },
  es: {
    title: "Protección de archivos",
    intro:
      "Cifra un archivo en este dispositivo. Su nombre y contenido permanecen en el navegador; puedes guardar el archivo protegido donde quieras.",
    boundary:
      "Formato poscuántico experimental: X-Wing (ML-KEM-768 + X25519), HKDF y AES-256-GCM. Esta implementación no tiene auditoría de seguridad independiente. No verifica al remitente ni protege un dispositivo comprometido.",
    create: "Crear identidad de destinatario",
    recipient: "Clave pública del destinatario",
    fingerprint:
      "Compara esta huella con el destinatario por un canal de confianza.",
    recovery: "Clave privada de recuperación",
    export: "Descargar clave privada de recuperación",
    keyWarning:
      "Guarda esta clave sin conexión y separada de los archivos protegidos. Quien la tenga puede descifrarlos. Oknef no puede recuperar una clave perdida.",
    file: "Elegir archivo (hasta 2 MiB)",
    protect: "Cifrar y descargar .oknefq",
    open: "Descifrar y descargar original",
    protectedFile: "Elegir archivo protegido .oknefq",
    acknowledge: "He guardado mi clave privada de forma segura.",
    failed:
      "No se pudo usar el archivo o la clave. Revisa destinatario, formato y tamaño; los archivos alterados no se abren.",
    done: "Descarga creada en este dispositivo.",
    busy: "Procesando localmente…",
    clear: "Borrar claves de memoria",
    share:
      "Comparte solo la clave pública. Confirma su huella antes de cifrar para otra persona.",
  },
  de: {
    title: "Dateischutz",
    intro:
      "Verschlüssle eine Datei auf diesem Gerät. Name und Inhalt bleiben im Browser; die geschützte Datei lässt sich überall speichern.",
    boundary:
      "Experimentelles Postquanten-Dateiformat: X-Wing (ML-KEM-768 + X25519), HKDF und AES-256-GCM. Diese Implementierung wurde nicht unabhängig sicherheitsgeprüft. Sie bestätigt keinen Absender und schützt kein kompromittiertes Gerät.",
    create: "Empfängeridentität erstellen",
    recipient: "Öffentlicher Empfängerschlüssel",
    fingerprint:
      "Vergleiche diesen Fingerabdruck mit dem Empfänger über einen vertrauenswürdigen Kanal.",
    recovery: "Privater Wiederherstellungsschlüssel",
    export: "Privaten Schlüssel herunterladen",
    keyWarning:
      "Bewahre diesen Schlüssel offline und getrennt von geschützten Dateien auf. Wer ihn besitzt, kann deine Dateien entschlüsseln. Oknef kann verlorene Schlüssel nicht wiederherstellen.",
    file: "Datei auswählen (bis 2 MiB)",
    protect: "Verschlüsseln und .oknefq herunterladen",
    open: "Entschlüsseln und Original herunterladen",
    protectedFile: "Geschützte .oknefq-Datei auswählen",
    acknowledge: "Ich habe meinen privaten Schlüssel sicher gespeichert.",
    failed:
      "Datei oder Schlüssel konnten nicht verwendet werden. Prüfe Empfänger, Format und Größe; veränderte Dateien lassen sich nicht öffnen.",
    done: "Download auf diesem Gerät erstellt.",
    busy: "Lokale Verarbeitung…",
    clear: "Schlüssel löschen",
    share:
      "Teile nur den öffentlichen Schlüssel. Bestätige seinen Fingerabdruck vor der Verschlüsselung für andere.",
  },
  fr: {
    title: "Protection des fichiers",
    intro:
      "Chiffrez un fichier sur cet appareil. Son nom et son contenu restent dans le navigateur ; le fichier protégé peut être conservé partout.",
    boundary:
      "Format postquantique expérimental : X-Wing (ML-KEM-768 + X25519), HKDF et AES-256-GCM. Cette implémentation n’a pas d’audit de sécurité indépendant. Elle ne vérifie pas l’expéditeur et ne protège pas un appareil compromis.",
    create: "Créer une identité destinataire",
    recipient: "Clé publique du destinataire",
    fingerprint:
      "Comparez cette empreinte avec le destinataire par un canal de confiance.",
    recovery: "Clé privée de récupération",
    export: "Télécharger la clé privée",
    keyWarning:
      "Conservez cette clé hors ligne et séparée des fichiers protégés. Quiconque la possède peut déchiffrer vos fichiers. Oknef ne peut pas récupérer une clé perdue.",
    file: "Choisir un fichier (jusqu’à 2 Mio)",
    protect: "Chiffrer et télécharger .oknefq",
    open: "Déchiffrer et télécharger l’original",
    protectedFile: "Choisir un fichier protégé .oknefq",
    acknowledge: "J’ai conservé ma clé privée en lieu sûr.",
    failed:
      "Impossible d’utiliser ce fichier ou cette clé. Vérifiez destinataire, format et taille ; les fichiers modifiés ne peuvent pas être ouverts.",
    done: "Téléchargement créé sur cet appareil.",
    busy: "Traitement local…",
    clear: "Effacer les clés",
    share:
      "Partagez uniquement la clé publique. Confirmez son empreinte avant de chiffrer pour un tiers.",
  },
} as const;
