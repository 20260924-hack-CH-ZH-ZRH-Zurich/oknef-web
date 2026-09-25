import { part1 } from "./en/part1";
import { part2 } from "./en/part2";
import { part3 } from "./en/part3";
import { part4 } from "./en/part4";
export const en = { ...part1, ...part2, ...part3, ...part4 } as const;
export type TranslationKey = keyof typeof en;
export type Messages = Record<TranslationKey, string>;
