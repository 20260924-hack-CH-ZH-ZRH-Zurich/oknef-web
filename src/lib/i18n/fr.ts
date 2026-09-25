import type { Messages } from "./en";
import { part1 } from "./fr/part1";
import { part2 } from "./fr/part2";
import { part3 } from "./fr/part3";
import { part4 } from "./fr/part4";
export const fr: Messages = { ...part1, ...part2, ...part3, ...part4 };
