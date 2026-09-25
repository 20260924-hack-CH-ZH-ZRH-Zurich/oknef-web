import type { Locale } from "@/features/preferences/Preferences";

const en = {
  title: "Encrypted vault",
  subtitle:
    "Encrypt sensitive records in this browser before they reach the server.",
  locked: "Your vault is locked",
  unlock: "Unlock vault",
  create: "Create a recovery key",
  import: "Import recovery key",
  recovery: "Recovery key",
  newKey: "Save your recovery key",
  keyWarning:
    "This key can decrypt your vault. Store it in a trusted password manager or encrypted offline storage. Oknef cannot recover it for you. Never share it with the assistant or another person.",
  acknowledge:
    "I have saved this recovery key securely and understand that losing it means losing access.",
  open: "Open encrypted vault",
  lock: "Lock vault",
  empty: "No encrypted records yet",
  add: "Add encrypted record",
  label: "Record name",
  secret: "Sensitive content",
  notes: "Private notes",
  save: "Encrypt and save",
  cancel: "Cancel",
  close: "Close",
  show: "Reveal record",
  hide: "Hide content",
  failed:
    "The record could not be decrypted. Check your recovery key and try again.",
  error: "The vault request could not be completed. Please try again.",
  wrongKey: "Enter a valid Oknef recovery key.",
  notice:
    "AES-256-GCM encryption happens in your browser. Only an encrypted envelope is stored on the server. The key is kept in this tab's memory while unlocked. This is not post-quantum encryption or an independently audited password manager.",
  memory:
    "Leaving this page or locking the vault removes the key from application state. Protect your device while the vault is open.",
  record: "Encrypted record",
  export: "Export encrypted .oknef file",
  delete: "Delete encrypted record",
  confirmDelete: "Delete this encrypted record? This cannot be undone.",
  created: "Created",
  loading: "Loading encrypted records…",
  encryption: "Browser encryption",
  lostKey: "No server-side key recovery",
  copied: "Copied",
  copy: "Copy recovery key",
  plaintext: "Decrypted only in this browser",
  keyPlaceholder: "oknef-key-v1.…",
  keyExists:
    "Use the original recovery key to open existing records. A new key cannot decrypt records saved under an earlier key.",
  showKey: "Show recovery key",
  hideKey: "Hide recovery key",
  downloadKey: "Export recovery key",
  exportWarning:
    "Recovery key export contains the decryption key. Keep it protected and separate from encrypted records.",
  passkeys: "Passkeys",
  passkeyBody:
    "Register a device passkey for future sign-in. Your device decides whether to use a fingerprint, face recognition, or a device PIN.",
  addPasskey: "Add a passkey",
  passkeySaved: "Passkey registered",
  passkeyLogin: "Sign in with a passkey",
  passkeyFailed:
    "Passkey verification did not complete. Please try again or use your password.",
  passkeyUnsupported:
    "Passkeys require a supported browser and a secure connection.",
  deviceName: "Device name",
  passkeyHint:
    "The registration and sign-in ceremonies are verified by the server. A virtual test authenticator is not evidence of Face ID hardware verification.",
};
type VaultMessages = Record<keyof typeof en, string>;
const de: VaultMessages = {
  title: "Verschlüsselter Tresor",
  subtitle:
    "Vertrauliche Einträge werden in diesem Browser verschlüsselt, bevor sie den Server erreichen.",
  locked: "Dein Tresor ist gesperrt",
  unlock: "Tresor entsperren",
  create: "Wiederherstellungsschlüssel erstellen",
  import: "Wiederherstellungsschlüssel importieren",
  recovery: "Wiederherstellungsschlüssel",
  newKey: "Speichere deinen Wiederherstellungsschlüssel",
  keyWarning:
    "Dieser Schlüssel kann deinen Tresor entschlüsseln. Bewahre ihn in einem vertrauenswürdigen Passwortmanager oder verschlüsselten Offline-Speicher auf. Oknef kann ihn nicht wiederherstellen. Teile ihn niemals mit dem Assistenten oder einer anderen Person.",
  acknowledge:
    "Ich habe den Schlüssel sicher gespeichert und verstehe, dass sein Verlust den Zugriff dauerhaft verhindert.",
  open: "Verschlüsselten Tresor öffnen",
  lock: "Tresor sperren",
  empty: "Noch keine verschlüsselten Einträge",
  add: "Verschlüsselten Eintrag hinzufügen",
  label: "Name des Eintrags",
  secret: "Vertraulicher Inhalt",
  notes: "Private Notizen",
  save: "Verschlüsseln und speichern",
  cancel: "Abbrechen",
  close: "Schließen",
  show: "Eintrag anzeigen",
  hide: "Inhalt ausblenden",
  failed:
    "Der Eintrag konnte nicht entschlüsselt werden. Prüfe deinen Schlüssel und versuche es erneut.",
  error:
    "Die Tresoranfrage konnte nicht abgeschlossen werden. Bitte versuche es erneut.",
  wrongKey: "Gib einen gültigen Oknef-Wiederherstellungsschlüssel ein.",
  notice:
    "Die AES-256-GCM-Verschlüsselung erfolgt im Browser. Der Server speichert nur einen verschlüsselten Umschlag. Der Schlüssel bleibt während der Entsperrung im Speicher dieses Tabs. Dies ist weder Post-Quanten-Verschlüsselung noch ein unabhängig geprüfter Passwortmanager.",
  memory:
    "Beim Verlassen der Seite oder Sperren wird der Schlüssel aus dem Anwendungszustand entfernt. Schütze dein Gerät bei geöffnetem Tresor.",
  record: "Verschlüsselter Eintrag",
  export: "Verschlüsselte .oknef-Datei exportieren",
  delete: "Verschlüsselten Eintrag löschen",
  confirmDelete: "Diesen verschlüsselten Eintrag unwiderruflich löschen?",
  created: "Erstellt",
  loading: "Verschlüsselte Einträge werden geladen…",
  encryption: "Verschlüsselung im Browser",
  lostKey: "Keine serverseitige Schlüsselwiederherstellung",
  copied: "Kopiert",
  copy: "Schlüssel kopieren",
  plaintext: "Nur in diesem Browser entschlüsselt",
  keyPlaceholder: "oknef-key-v1.…",
  keyExists:
    "Verwende für vorhandene Einträge den ursprünglichen Schlüssel. Ein neuer Schlüssel kann ältere Einträge nicht entschlüsseln.",
  showKey: "Schlüssel anzeigen",
  hideKey: "Schlüssel ausblenden",
  downloadKey: "Schlüssel exportieren",
  exportWarning:
    "Der Schlüsselexport enthält den Entschlüsselungsschlüssel. Bewahre ihn geschützt und getrennt von den verschlüsselten Einträgen auf.",
  passkeys: "Passkeys",
  passkeyBody:
    "Registriere einen Geräte-Passkey für spätere Anmeldungen. Dein Gerät entscheidet zwischen Fingerabdruck, Gesichtserkennung und Geräte-PIN.",
  addPasskey: "Passkey hinzufügen",
  passkeySaved: "Passkey registriert",
  passkeyLogin: "Mit Passkey anmelden",
  passkeyFailed:
    "Die Passkey-Prüfung wurde nicht abgeschlossen. Versuche es erneut oder verwende dein Passwort.",
  passkeyUnsupported:
    "Passkeys benötigen einen unterstützten Browser und eine sichere Verbindung.",
  deviceName: "Gerätename",
  passkeyHint:
    "Registrierung und Anmeldung werden vom Server verifiziert. Ein virtueller Test-Authentifikator belegt keine Face-ID-Hardwareprüfung.",
};
const es: VaultMessages = {
  title: "Bóveda cifrada",
  subtitle:
    "Cifra los registros sensibles en este navegador antes de que lleguen al servidor.",
  locked: "Tu bóveda está bloqueada",
  unlock: "Desbloquear bóveda",
  create: "Crear clave de recuperación",
  import: "Importar clave de recuperación",
  recovery: "Clave de recuperación",
  newKey: "Guarda tu clave de recuperación",
  keyWarning:
    "Esta clave puede descifrar tu bóveda. Guárdala en un gestor de contraseñas fiable o en almacenamiento sin conexión cifrado. Oknef no puede recuperarla. Nunca la compartas con el asistente ni con otra persona.",
  acknowledge:
    "He guardado esta clave de forma segura y entiendo que perderla significa perder el acceso.",
  open: "Abrir bóveda cifrada",
  lock: "Bloquear bóveda",
  empty: "Aún no hay registros cifrados",
  add: "Añadir registro cifrado",
  label: "Nombre del registro",
  secret: "Contenido sensible",
  notes: "Notas privadas",
  save: "Cifrar y guardar",
  cancel: "Cancelar",
  close: "Cerrar",
  show: "Mostrar registro",
  hide: "Ocultar contenido",
  failed:
    "No se pudo descifrar el registro. Comprueba la clave y vuelve a intentarlo.",
  error: "No se pudo completar la solicitud. Vuelve a intentarlo.",
  wrongKey: "Introduce una clave de recuperación válida de Oknef.",
  notice:
    "El cifrado AES-256-GCM se realiza en tu navegador. El servidor solo guarda un contenedor cifrado. La clave permanece en la memoria de esta pestaña mientras está desbloqueada. No es cifrado poscuántico ni un gestor de contraseñas auditado de forma independiente.",
  memory:
    "Salir de la página o bloquear la bóveda elimina la clave del estado de la aplicación. Protege tu dispositivo mientras esté abierta.",
  record: "Registro cifrado",
  export: "Exportar archivo .oknef cifrado",
  delete: "Eliminar registro cifrado",
  confirmDelete: "¿Eliminar este registro cifrado de forma irreversible?",
  created: "Creado",
  loading: "Cargando registros cifrados…",
  encryption: "Cifrado en el navegador",
  lostKey: "Sin recuperación de claves en el servidor",
  copied: "Copiado",
  copy: "Copiar clave",
  plaintext: "Descifrado solo en este navegador",
  keyPlaceholder: "oknef-key-v1.…",
  keyExists:
    "Usa la clave original para abrir los registros existentes. Una clave nueva no puede descifrar registros guardados con una anterior.",
  showKey: "Mostrar clave",
  hideKey: "Ocultar clave",
  downloadKey: "Exportar clave",
  exportWarning:
    "La exportación contiene la clave de descifrado. Protégela y guárdala separada de los registros cifrados.",
  passkeys: "Passkeys",
  passkeyBody:
    "Registra una passkey del dispositivo para futuros accesos. Tu dispositivo decide si usa huella, reconocimiento facial o PIN.",
  addPasskey: "Añadir passkey",
  passkeySaved: "Passkey registrada",
  passkeyLogin: "Acceder con passkey",
  passkeyFailed:
    "No se completó la verificación. Vuelve a intentarlo o usa tu contraseña.",
  passkeyUnsupported:
    "Las passkeys requieren un navegador compatible y una conexión segura.",
  deviceName: "Nombre del dispositivo",
  passkeyHint:
    "El servidor verifica el registro y el acceso. Un autenticador virtual de prueba no demuestra una verificación con hardware Face ID.",
};
const fr: VaultMessages = {
  title: "Coffre chiffré",
  subtitle:
    "Chiffrez les données sensibles dans ce navigateur avant leur envoi au serveur.",
  locked: "Votre coffre est verrouillé",
  unlock: "Déverrouiller le coffre",
  create: "Créer une clé de récupération",
  import: "Importer une clé de récupération",
  recovery: "Clé de récupération",
  newKey: "Conservez votre clé de récupération",
  keyWarning:
    "Cette clé permet de déchiffrer votre coffre. Conservez-la dans un gestionnaire de mots de passe fiable ou un stockage hors ligne chiffré. Oknef ne peut pas la récupérer. Ne la partagez jamais avec l’assistant ou une autre personne.",
  acknowledge:
    "J’ai conservé cette clé en lieu sûr et je comprends que sa perte signifie la perte d’accès.",
  open: "Ouvrir le coffre chiffré",
  lock: "Verrouiller le coffre",
  empty: "Aucun enregistrement chiffré",
  add: "Ajouter un enregistrement chiffré",
  label: "Nom de l’enregistrement",
  secret: "Contenu sensible",
  notes: "Notes privées",
  save: "Chiffrer et enregistrer",
  cancel: "Annuler",
  close: "Fermer",
  show: "Afficher l’enregistrement",
  hide: "Masquer le contenu",
  failed: "Le déchiffrement a échoué. Vérifiez votre clé et réessayez.",
  error: "La demande n’a pas abouti. Veuillez réessayer.",
  wrongKey: "Saisissez une clé de récupération Oknef valide.",
  notice:
    "Le chiffrement AES-256-GCM se fait dans votre navigateur. Seule une enveloppe chiffrée est conservée sur le serveur. La clé reste dans la mémoire de cet onglet pendant le déverrouillage. Il ne s’agit ni de chiffrement post-quantique ni d’un gestionnaire audité indépendamment.",
  memory:
    "Quitter la page ou verrouiller le coffre retire la clé de l’état de l’application. Protégez votre appareil quand le coffre est ouvert.",
  record: "Enregistrement chiffré",
  export: "Exporter le fichier .oknef chiffré",
  delete: "Supprimer l’enregistrement chiffré",
  confirmDelete: "Supprimer définitivement cet enregistrement chiffré ?",
  created: "Créé",
  loading: "Chargement des enregistrements chiffrés…",
  encryption: "Chiffrement dans le navigateur",
  lostKey: "Aucune récupération de clé côté serveur",
  copied: "Copié",
  copy: "Copier la clé",
  plaintext: "Déchiffré uniquement dans ce navigateur",
  keyPlaceholder: "oknef-key-v1.…",
  keyExists:
    "Utilisez la clé originale pour ouvrir les enregistrements existants. Une nouvelle clé ne déchiffre pas les anciens enregistrements.",
  showKey: "Afficher la clé",
  hideKey: "Masquer la clé",
  downloadKey: "Exporter la clé",
  exportWarning:
    "L’export contient la clé de déchiffrement. Protégez-le et conservez-le séparément des données chiffrées.",
  passkeys: "Passkeys",
  passkeyBody:
    "Enregistrez une passkey pour vos prochaines connexions. Votre appareil choisit entre empreinte, reconnaissance faciale et code PIN.",
  addPasskey: "Ajouter une passkey",
  passkeySaved: "Passkey enregistrée",
  passkeyLogin: "Se connecter avec une passkey",
  passkeyFailed:
    "La vérification n’a pas abouti. Réessayez ou utilisez votre mot de passe.",
  passkeyUnsupported:
    "Les passkeys nécessitent un navigateur compatible et une connexion sécurisée.",
  deviceName: "Nom de l’appareil",
  passkeyHint:
    "Le serveur vérifie l’inscription et la connexion. Un authentificateur virtuel de test ne prouve pas une vérification matérielle Face ID.",
};
export const vaultMessages: Record<Locale, VaultMessages> = { en, de, es, fr };
