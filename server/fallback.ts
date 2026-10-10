import type { Ledger, Finding } from "../shared/schema.js";
import { CHECKS } from "./audit/checks.js";
import { resolveCitations } from "./audit/citations.js";
import { applicableChecks, type DocketDraft } from "./agent.js";

/**
 * Deterministic docket used when the model is unavailable (no key, rate limit, outage).
 * Same checks, same citation guard; the text is a fixed template, so it is English-only.
 * The UI labels it "generated without AI".
 */
export function fallbackDocket(ledger: Ledger, reason: string): DocketDraft {
  const findings: Finding[] = applicableChecks(ledger).flatMap((id) => CHECKS[id](ledger));
  const issues = findings.filter((f) => f.status === "possible_issue");
  const citations = resolveCitations(findings.flatMap((f) => f.clauseIds));
  const period = ledger.statements[0] ? `${ledger.statements[0].periodStart} to ${ledger.statements[0].periodEnd}` : "the period shown";
  const vague = findings.filter((f) => f.checkId === "C1");

  const list = issues.map((f, i) => `${i + 1}. ${f.title}. (${f.arithmetic})`).join("\n");
  const summary =
    issues.length === 0
      ? "No possible issues were found in the confirmed data."
      : `${issues.length} possible issue(s) for review were found for ${period}. Each one shows the numbers it is based on.`;

  const letter = `To: Internal Dispute Resolution Committee, [Platform name]
Subject: Grievance under section 22(2), Karnataka Platform Based Gig Workers (Social Security and Welfare) Act, 2025

I am a registered platform-based gig worker. For ${period}, my own payout screenshots and bank SMS show the following possible issues for review:

${list || "None."}

I request a written Action Taken Report within the time set by the Act. The supporting screenshots, SMS and calculations are attached.

I note that the Act is currently under challenge before the Karnataka High Court.

Name: ____________   Worker ID: ____________   Date: ____________`;

  const s13Request = `Under section 13(1) of the Act, I request information on how the following deductions were calculated: ${
    vague.length ? vague.map((f) => f.title.replace(/ has no stated reason$/, "")).join("; ") : "all deductions in this period"
  }. Please explain the rule, the inputs used, and whether an automated system made the decision.`;

  return { summary: `${summary} (Generated without AI: ${reason})`, findings, letter, s13Request, citations, generatedBy: "fallback" };
}
