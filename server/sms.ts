import type { BankCredit } from "../shared/schema.js";

/**
 * Parse pasted bank SMS into credits. Deterministic and offline: no model sees the SMS.
 * Bank SMS wording varies, so this is deliberately tolerant; the worker confirms every row.
 * Messages that are not credits (debits, OTPs, promos) are returned in `skipped` with a reason.
 */
export interface SmsParseResult {
  credits: BankCredit[];
  skipped: { text: string; reason: string }[];
}

const MONTHS: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

const CREDIT = /\b(credited|credit(?:ed)?\s+to|received|deposited|cr\b)/i;
const DEBIT = /\b(debited|debit(?:ed)?\s+from|spent|withdrawn|paid\s+to|dr\b)/i;
const OTP = /\b(otp|one[\s-]time\s+password|verification\s+code)\b/i;
// "Rs.6,105.00", "INR 6105", "₹ 6,105", "Rs 6105.5"
const AMOUNT = /(?:rs\.?|inr|₹)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i;
// Payer: "from QUICKBITE PARTNER PVT LTD", "by QUICKBITE...", "Info: NEFT-QUICKBITE..."
const PAYER = /(?:\bfrom\b|\bby\b|info[:\s-]+(?:neft|imps|upi)[-/:\s]*)\s*([A-Z][A-Z0-9 &.\-]{2,40}?)(?=\s*(?:\.|,|;|\(|ref|on\b|avl|bal|utr|$))/;
const REF = /\b(?:ref(?:erence)?(?:\s*no)?|utr|txn(?:\s*id)?)[\s.:#-]*([A-Z0-9]{6,22})/i;

function parseDate(text: string, fallbackYear: number): string | undefined {
  // 06-10-2026, 06/10/26, 06.10.2026
  let m = text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/);
  if (m) {
    const y = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  }
  // 06-Oct-26, 06 Oct 2026, 06Oct2026, 6 October 2026
  m = text.match(/\b(\d{1,2})[-\s]?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[-\s,]*(\d{4}|\d{2})?(?!\d)/i);
  if (m && MONTHS[m[2].toLowerCase()]) {
    const y = m[3] ? (m[3].length === 2 ? `20${m[3]}` : m[3]) : String(fallbackYear);
    return `${y}-${MONTHS[m[2].toLowerCase()]}-${m[1].padStart(2, "0")}`;
  }
  // 2026-10-06
  m = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return undefined;
}

/** Split a pasted block into messages: blank lines separate SMS; single newlines inside one SMS are joined. */
export function splitMessages(pasted: string): string[] {
  return pasted
    .split(/\r?\n\s*\r?\n/)
    .map((m) => m.replace(/\s*\r?\n\s*/g, " ").trim())
    .filter(Boolean);
}

export function parseSms(pasted: string, opts: { platformHints?: string[]; year?: number } = {}): SmsParseResult {
  const hints = (opts.platformHints ?? []).map((h) => h.toLowerCase());
  const year = opts.year ?? new Date().getFullYear();
  const credits: BankCredit[] = [];
  const skipped: SmsParseResult["skipped"] = [];

  splitMessages(pasted).forEach((text, i) => {
    if (OTP.test(text)) return skipped.push({ text, reason: "OTP message" });
    const isCredit = CREDIT.test(text);
    const isDebit = DEBIT.test(text);
    if (!isCredit || (isDebit && text.search(DEBIT) < text.search(CREDIT)))
      return skipped.push({ text, reason: "not a credit" });
    const amt = text.match(AMOUNT);
    if (!amt) return skipped.push({ text, reason: "no amount found" });
    const date = parseDate(text, year);
    if (!date) return skipped.push({ text, reason: "no date found" });

    const payer = text.match(PAYER)?.[1]?.trim();
    const fromPlatform = hints.length === 0 || hints.some((h) => text.toLowerCase().includes(h));
    credits.push({
      date,
      amount: Number(amt[1].replace(/,/g, "")),
      payer,
      ref: text.match(REF)?.[1],
      rawText: text,
      sourceId: `sms-${i + 1}`,
      fromPlatform,
    });
  });

  return { credits, skipped };
}
