import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { Ledger } from "../../shared/schema.js";
import { CHECKS, dedupe } from "./checks.js";
import { resolveCitations, lookupClause } from "./citations.js";
import { parseSms } from "../sms.js";

const sms = parseSms(readFileSync(new URL("../../demo/data/ravi-sms.txt", import.meta.url), "utf8"), { platformHints: ["quickbite"] });
const ravi = Ledger.parse({
  ...JSON.parse(readFileSync(new URL("../../demo/data/ravi-week.json", import.meta.url), "utf8")),
  bankCredits: sms.credits,
});
const base = (over: Partial<Ledger> = {}): Ledger =>
  Ledger.parse({ statements: [], inputs: { loggedInHours: 10, fuelCost: 0 }, ...over });
const stmt = (lines: any[], net: number, img = "s1") => ({
  periodStart: "2026-10-01", periodEnd: "2026-10-07", netPayoutShown: net, sourceImage: img,
  lines: lines.map((l) => ({ sourceImage: img, ...l })),
});

describe("dedupe", () => {
  it("counts an order shown on two overlapping screenshots once", () => {
    const lines = dedupe(ravi)[0].lines;
    expect(lines.filter((l) => l.orderId === "KA-88213" && l.kind === "earning")).toHaveLength(1);
    expect(dedupe(ravi)).toHaveLength(1);
  });
});

describe("C1 deduction reasons", () => {
  it("flags vague labels and passes specific ones (demo: ₹275)", () => {
    const f = CHECKS.C1(ravi);
    expect(f.map((x) => x.title)).toEqual([
      'Deduction "Adjustment" of ₹180 has no stated reason',
      'Deduction "Other" of ₹95 has no stated reason',
    ]);
    expect(f.every((x) => x.judgement && x.clauseIds.includes("KA-15-1"))).toBe(true);
  });
  it("flags an empty label as not a judgement call", () => {
    const f = CHECKS.C1(base({ statements: [stmt([{ kind: "deduction", label: " ", amount: 40 }], 0)] }));
    expect(f).toHaveLength(1);
    expect(f[0].judgement).toBe(false);
  });
});

describe("C2 statement arithmetic", () => {
  it("finds the ₹120 gap in the demo week", () => {
    const [f] = CHECKS.C2(ravi);
    expect(f.status).toBe("possible_issue");
    expect(f.arithmetic).toContain("₹6650 earnings − ₹425 deductions = ₹6225; shown ₹6105; gap ₹120");
  });
  it("tolerates ₹0.50 rounding", () => {
    const [f] = CHECKS.C2(base({ statements: [stmt([{ kind: "earning", label: "x", amount: 100.5 }], 100)] }));
    expect(f.status).toBe("ok");
  });
});

describe("C3 deactivation notice", () => {
  it("flags same-day block with no reason", () => {
    const [f] = CHECKS.C3(ravi);
    expect(f.status).toBe("possible_issue");
    expect(f.title).toBe("Block/deactivation with no written reason and 0 days' notice");
    expect(f.clauseIds).toEqual(["KA-14-2"]);
  });
  it("passes 14 days' notice with a reason", () => {
    const [f] = CHECKS.C3(base({ blockNotices: [{ noticeDate: "2026-10-01", effectiveDate: "2026-10-15", reasonText: "Repeated order cancellations", sourceImage: "n" }] }));
    expect(f.status).toBe("ok");
  });
});

describe("C4 payment cycle", () => {
  it("passes weekly payouts (demo dates come from the SMS)", () => {
    expect(CHECKS.C4(ravi).map((f) => f.status)).toEqual(["ok"]);
  });
  it("flags a 10-day gap", () => {
    const f = CHECKS.C4(base({ payoutDates: ["2026-10-01", "2026-10-11"] }));
    expect(f[0].status).toBe("possible_issue");
    expect(f[0].title).toBe("10 days between payouts");
  });
});

describe("C5 hourly earnings", () => {
  it("gives ₹90/h real vs ₹128/h gross for the demo", () => {
    const [f] = CHECKS.C5(ravi);
    expect(f.title).toBe("Real earnings ₹90/hour vs ₹128/hour gross");
  });
});

describe("C7 bank credit vs app payout", () => {
  it("finds the bank received ₹100 less than the app showed (demo)", () => {
    const [f] = CHECKS.C7(ravi);
    expect(f.status).toBe("possible_issue");
    expect(f.title).toBe("Bank received ₹100 less than the app's net payout");
    expect(f.evidence).toEqual(["statement-1", "sms-5"]);
  });
  it("passes when the credit matches", () => {
    const ok = Ledger.parse({ ...ravi, bankCredits: [{ ...sms.credits[2], amount: 6105 }] });
    expect(CHECKS.C7(ok)[0].status).toBe("ok");
  });
  it("flags a week with no credit at all", () => {
    const none = Ledger.parse({ ...ravi, bankCredits: [sms.credits[0]] });
    expect(CHECKS.C7(none)[0].title).toBe("No bank credit found for the week ending 2026-10-05");
  });
  it("is skipped when no SMS were pasted", () => {
    expect(CHECKS.C7(Ledger.parse({ ...ravi, bankCredits: [] }))).toEqual([]);
  });
});

describe("citation guard", () => {
  it("resolves every clause id used by the checks", () => {
    const ids = Object.values(CHECKS).flatMap((c) => c(ravi)).flatMap((f) => f.clauseIds);
    expect(resolveCitations(ids).every((c) => c.text.length > 50)).toBe(true);
  });
  it("rejects an invented clause", () => {
    expect(() => resolveCitations(["KA-15-1", "KA-99-9"])).toThrow(/KA-99-9/);
    expect(lookupClause("KA-99-9")).toBeNull();
  });
});
