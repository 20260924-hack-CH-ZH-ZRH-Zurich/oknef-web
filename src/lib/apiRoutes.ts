const permitted =
  /^(auth\/(login|register|me|logout|demo)|assets(?:\/[A-Za-z0-9_-]+)?|dashboard|succession(?:\/[A-Za-z0-9_-]+(?:\/(review|cancel))?)?|vault(?:\/[A-Za-z0-9_-]+)?|passkeys(?:\/(register|login)\/(start|finish))?|members|models|workflows(?:\/runs)?|agents\/catalog|ocr|chat(?:\/image|\/sessions(?:\/[A-Za-z0-9_-]+(?:\/messages)?)?)?|voice\/(session|call|policy)|media\/analyze|drive(?:\/[A-Za-z0-9_-]+)?|integrations(?:\/[A-Za-z0-9_-]+)?|graph|transcribe|audit|capabilities|security\/(overview|mode|simulations|sessions(?:\/[A-Za-z0-9_-]+(?:\/questions)?)?)|workspaces(?:\/switch)?|invitations(?:\/[A-Za-z0-9_-]+\/accept)?|approvals(?:\/(policies|requests(?:\/[A-Za-z0-9_-]+\/votes)?))?)$/;
export const isPermittedEndpoint = (endpoint: string) =>
  permitted.test(endpoint);
