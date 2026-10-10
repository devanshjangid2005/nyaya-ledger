import type { Ledger, Finding } from "../../shared/schema.js";

const VAGUE = /^(adjust(ment)?s?|other|misc(ellaneous)?|deductions?|charges?|recovery)$/i;
const TOL = 1; // ₹1 rounding tolerance
const days = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
const rs = (n: number) => `₹${Number.isInteger(n) ? n : n.toFixed(2)}`;

/** Merge overlapping screenshots of the same week: a line with the same orderId+kind+label+amount is counted once. */
export function dedupe(ledger: Ledger) {
  const seen = new Set<string>();
  const byPeriod = new Map<string, Ledger["statements"][number]>();
  for (const s of ledger.statements) {
    const key = `${s.periodStart}|${s.periodEnd}`;
    const lines = s.lines.filter((l) => {
      if (!l.orderId) return true;
      const k = `${key}|${l.orderId}|${l.kind}|${l.label}|${l.amount}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    const prev = byPeriod.get(key);
    // Overlapping screenshots of one statement share the period and the net payout total.
    byPeriod.set(key, prev ? { ...prev, lines: [...prev.lines, ...lines] } : { ...s, lines });
  }
  return [...byPeriod.values()];
}

export function c1DeductionReasons(ledger: Ledger): Finding[] {
  return dedupe(ledger).flatMap((s) =>
    s.lines
      .filter((l) => l.kind === "deduction")
      .filter((l) => l.label.trim() === "" || VAGUE.test(l.label.trim()))
      .map<Finding>((l) => ({
        checkId: "C1",
        status: "possible_issue",
        title: `Deduction "${l.label || "(no label)"}" of ${rs(l.amount)} has no stated reason`,
        arithmetic: `The label "${l.label}" does not say why ${rs(l.amount)} was deducted.`,
        evidence: [l.sourceImage],
        clauseIds: ["KA-15-1"],
        judgement: l.label.trim() !== "",
      })),
  );
}

export function c2Arithmetic(ledger: Ledger): Finding[] {
  return dedupe(ledger).map<Finding>((s) => {
    const earn = s.lines.filter((l) => l.kind !== "deduction").reduce((a, l) => a + l.amount, 0);
    const ded = s.lines.filter((l) => l.kind === "deduction").reduce((a, l) => a + l.amount, 0);
    const expected = earn - ded;
    const gap = expected - s.netPayoutShown;
    const bad = Math.abs(gap) > TOL;
    return {
      checkId: "C2",
      status: bad ? "possible_issue" : "ok",
      title: bad ? `Net payout differs from line items by ${rs(Math.abs(gap))}` : "Line items add up to the net payout",
      arithmetic: `${rs(earn)} earnings − ${rs(ded)} deductions = ${rs(expected)}; shown ${rs(s.netPayoutShown)}; gap ${rs(gap)}`,
      evidence: [s.sourceImage],
      clauseIds: bad ? ["KA-15-1", "KA-22-2"] : [],
    };
  });
}

export function c3Deactivation(ledger: Ledger): Finding[] {
  return ledger.blockNotices.map<Finding>((n) => {
    const notice = days(n.noticeDate, n.effectiveDate);
    const noReason = !n.reasonText || n.reasonText.trim() === "";
    const short = notice < 14;
    const bad = noReason || short;
    const problems = [noReason && "no written reason", short && `${notice} days' notice`].filter(Boolean).join(" and ");
    return {
      checkId: "C3",
      status: bad ? "possible_issue" : "ok",
      title: bad ? `Block/deactivation with ${problems}` : "Block notice gives a reason and at least 14 days' notice",
      arithmetic: `Notice ${n.noticeDate} → effective ${n.effectiveDate} = ${notice} days (Act: 14). Reason stated: ${noReason ? "none" : `"${n.reasonText}"`}. Immediate action is allowed in bodily-harm cases.`,
      evidence: [n.sourceImage],
      clauseIds: bad ? ["KA-14-2"] : [],
    };
  });
}

/** Payout dates from statements, worker input and platform bank credits (SMS), de-duplicated. */
export function payoutDates(ledger: Ledger): string[] {
  const fromSms = ledger.bankCredits.filter((c) => c.fromPlatform).map((c) => c.date);
  const fromStatements = ledger.statements.map((s) => s.payoutDate).filter((d): d is string => !!d);
  return [...new Set([...ledger.payoutDates, ...fromStatements, ...fromSms])].sort();
}

export function c4PaymentCycle(ledger: Ledger): Finding[] {
  const d = payoutDates(ledger);
  const out: Finding[] = [];
  for (let i = 1; i < d.length; i++) {
    const gap = days(d[i - 1], d[i]);
    if (gap > 7)
      out.push({
        checkId: "C4",
        status: "possible_issue",
        title: `${gap} days between payouts`,
        arithmetic: `${d[i - 1]} → ${d[i]} = ${gap} days (Act: at least weekly)`,
        evidence: [],
        clauseIds: ["KA-15-2"],
      });
  }
  if (d.length >= 2 && out.length === 0)
    out.push({ checkId: "C4", status: "ok", title: "Payouts at least weekly", arithmetic: d.join(" → "), evidence: [], clauseIds: [] });
  return out;
}

export function c5HourlyEarnings(ledger: Ledger): Finding[] {
  const st = dedupe(ledger);
  const gross = st.flatMap((s) => s.lines).filter((l) => l.kind !== "deduction").reduce((a, l) => a + l.amount, 0);
  const net = st.reduce((a, s) => a + s.netPayoutShown, 0);
  const { loggedInHours: h, fuelCost: f, upkeepCost: u } = ledger.inputs;
  const real = (net - f - u) / h;
  return [
    {
      checkId: "C5",
      status: "info",
      title: `Real earnings ₹${real.toFixed(0)}/hour vs ₹${(gross / h).toFixed(0)}/hour gross`,
      arithmetic: `(${rs(net)} net − ${rs(f)} fuel − ${rs(u)} upkeep) ÷ ${h} logged-in hours = ₹${real.toFixed(2)}/h; gross ${rs(gross)} ÷ ${h} h = ₹${(gross / h).toFixed(2)}/h`,
      evidence: st.map((s) => s.sourceImage),
      clauseIds: [],
    },
  ];
}

/**
 * C7: did the bank actually receive the net payout the app showed?
 * Matches each statement to platform credits dated within 3 days after the period ends.
 */
export function c7BankCredit(ledger: Ledger): Finding[] {
  const credits = ledger.bankCredits.filter((c) => c.fromPlatform);
  if (credits.length === 0) return [];
  const used = new Set<string>();
  return dedupe(ledger).map<Finding>((s) => {
    const window = credits.filter((c) => !used.has(c.sourceId) && days(s.periodEnd, c.date) >= 0 && days(s.periodEnd, c.date) <= 3);
    window.forEach((c) => used.add(c.sourceId));
    const received = window.reduce((a, c) => a + c.amount, 0);
    const gap = s.netPayoutShown - received;
    const evidence = [s.sourceImage, ...window.map((c) => c.sourceId)];
    if (window.length === 0)
      return {
        checkId: "C7",
        status: "possible_issue",
        title: `No bank credit found for the week ending ${s.periodEnd}`,
        arithmetic: `App shows ${rs(s.netPayoutShown)} net payout; no platform credit SMS dated ${s.periodEnd} to 3 days after.`,
        evidence,
        clauseIds: ["KA-15-2"],
      };
    const bad = gap > TOL;
    return {
      checkId: "C7",
      status: bad ? "possible_issue" : "ok",
      title: bad ? `Bank received ${rs(gap)} less than the app's net payout` : "Bank credit matches the app's net payout",
      arithmetic: `App net payout ${rs(s.netPayoutShown)}; bank credits ${window.map((c) => `${rs(c.amount)} on ${c.date}`).join(" + ")} = ${rs(received)}; difference ${rs(gap)}`,
      evidence,
      clauseIds: bad ? ["KA-15-1", "KA-22-2"] : [],
    };
  });
}

export const CHECKS = {
  C1: c1DeductionReasons,
  C2: c2Arithmetic,
  C3: c3Deactivation,
  C4: c4PaymentCycle,
  C5: c5HourlyEarnings,
  C7: c7BankCredit,
} as const;
export type CheckId = keyof typeof CHECKS;
