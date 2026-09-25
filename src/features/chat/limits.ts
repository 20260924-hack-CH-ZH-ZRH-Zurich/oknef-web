export function chatMessageTooLong(content: string) {
  return new TextEncoder().encode(content).length > 12000;
}

export const inputLimitText = {
  en: "This message is too long. Please shorten it before sending.",
  de: "Diese Nachricht ist zu lang. Bitte kürzen Sie sie vor dem Senden.",
  es: "Este mensaje es demasiado largo. Acórtalo antes de enviarlo.",
  fr: "Ce message est trop long. Veuillez le raccourcir avant de l’envoyer.",
} as const;
