import { z } from "zod";

export const LineItem = z.object({
  kind: z.enum(["earning", "incentive", "deduction"]),
  label: z.string(), // exactly as printed
  amount: z.number().nonnegative(), // rupees, always positive; kind gives the sign
  orderId: z.string().optional(),
  sourceImage: z.string(), // image id the value came from
});

export const Statement = z.object({
  periodStart: z.string(), // YYYY-MM-DD
  periodEnd: z.string(),
  payoutDate: z.string().optional(),
  netPayoutShown: z.number(),
  lines: z.array(LineItem),
  sourceImage: z.string(),
});

export const BlockNotice = z.object({
  noticeDate: z.string(), // date the notice was sent
  effectiveDate: z.string(), // date the block takes effect
  reasonText: z.string().optional(), // empty if none stated
  sourceImage: z.string(),
});

/** A bank credit read from a pasted SMS. The worker can untick credits that are not from the platform. */
export const BankCredit = z.object({
  date: z.string(), // YYYY-MM-DD, from the SMS body
  amount: z.number().positive(),
  payer: z.string().optional(), // e.g. "QUICKBITE PARTNER PVT LTD" when the SMS names it
  ref: z.string().optional(), // NEFT/IMPS/UPI reference
  rawText: z.string(), // the SMS exactly as pasted, kept as evidence
  sourceId: z.string(), // e.g. "sms-3"
  fromPlatform: z.boolean().default(true),
});
export type BankCredit = z.infer<typeof BankCredit>;

export const WorkerInputs = z.object({
  loggedInHours: z.number().positive(),
  fuelCost: z.number().nonnegative(),
  upkeepCost: z.number().nonnegative().default(0),
  language: z.enum(["kn", "hi", "en"]).default("kn"),
});

export const Ledger = z.object({
  statements: z.array(Statement),
  payoutDates: z.array(z.string()).default([]),
  blockNotices: z.array(BlockNotice).default([]),
  bankCredits: z.array(BankCredit).default([]),
  inputs: WorkerInputs,
});

export type Ledger = z.infer<typeof Ledger>;

export interface Finding {
  checkId: "C1" | "C2" | "C3" | "C4" | "C5" | "C6" | "C7";
  status: "possible_issue" | "ok" | "info" | "needs_input";
  title: string;
  arithmetic: string; // human-readable working
  evidence: string[]; // sourceImage ids
  clauseIds: string[]; // must exist in legal corpus
  judgement?: boolean; // true when the rule involves a judgement call (e.g. vague label)
}
