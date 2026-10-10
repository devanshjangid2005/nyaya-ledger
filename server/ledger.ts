import { Ledger, WorkerInputs, type BankCredit } from "../shared/schema.js";
import type { z } from "zod";
import type { Extracted } from "./extract.js";

/** Build the (pre-confirmation) ledger from extracted screenshots, parsed SMS and worker inputs. */
export function mergeLedger(extracted: Extracted[], bankCredits: BankCredit[], inputs: z.input<typeof WorkerInputs>) {
  const statements = extracted.flatMap((e) => (e.status === "ok" && e.type === "statement" ? [e.data] : []));
  const blockNotices = extracted.flatMap((e) => (e.status === "ok" && e.type === "block_notice" ? [e.data] : []));
  return Ledger.parse({ statements, blockNotices, bankCredits, payoutDates: [], inputs });
}
