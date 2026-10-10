import { readFileSync } from "node:fs";
import { Ledger } from "../shared/schema.js";
import { parseSms } from "./sms.js";

const read = (p: string) => readFileSync(new URL(`../demo/data/${p}`, import.meta.url), "utf8");

export const DEMO_PLATFORM_HINT = "quickbite";

/** Synthetic demo ledger (screenshots already extracted) + the pasted demo SMS. */
export function loadDemo() {
  const smsText = read("ravi-sms.txt");
  const sms = parseSms(smsText, { platformHints: [DEMO_PLATFORM_HINT], year: 2026 });
  const ledger = Ledger.parse({ ...JSON.parse(read("ravi-week.json")), bankCredits: sms.credits });
  return { ledger, smsText, sms };
}
