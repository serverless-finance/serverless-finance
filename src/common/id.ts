import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 10);

export const REGEX_ID = "(0-9a-z){10}";

export function generateId() {
  return nanoid();
}
