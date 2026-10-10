import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { Ledger } from "../shared/schema.js";
import { runAudit } from "./agent.js";
import { parseSms } from "./sms.js";

const ravi = Ledger.parse({
  ...JSON.parse(readFileSync(new URL("../demo/data/ravi-week.json", import.meta.url), "utf8")),
  bankCredits: parseSms(readFileSync(new URL("../demo/data/ravi-sms.txt", import.meta.url), "utf8"), { platformHints: ["quickbite"] }).credits,
});

/** Stub model: scripted tool calls, one per turn. Verifies the SDK wiring without an API key. */
function scripted(calls: { name: string; input: unknown }[]) {
  let i = 0;
  return {
    async *stream() {
      const c = calls[Math.min(i, calls.length - 1)];
      i++;
      yield { type: "tool-call-delta", toolCallId: `c${i}`, toolName: c.name, inputText: JSON.stringify(c.input) };
      yield { type: "finish", reason: "tool-calls" };
    },
  } as any;
}

describe("runAudit with Cline SDK Agent", () => {
  it("runs checks via tools and produces a docket with verified citations", async () => {
    const tools: string[] = [];
    const draft = await runAudit(ravi, async () => "", (e) => e.type === "tool" && tools.push(e.tool), scripted([
      { name: "get_ledger_summary", input: {} },
      { name: "run_checks", input: { checks: ["C1", "C2", "C3", "C4", "C5", "C7"] } },
      { name: "lookup_clause", input: { id: "KA-15-1" } },
      { name: "submit_docket", input: { summary: "s", letter: "ಪತ್ರ", s13Request: "r", clauseIds: ["KA-15-1"] } },
    ]));
    expect(tools).toEqual(["get_ledger_summary", "run_checks", "lookup_clause", "submit_docket"]);
    // C1 ×2 (Adjustment, Other), C2 gap ₹120, C3 block notice, C7 bank short ₹100
    expect(draft.findings.filter((f) => f.status === "possible_issue")).toHaveLength(5);
    expect(draft.citations.map((c) => c.id).sort()).toEqual(["KA-14-2", "KA-15-1", "KA-22-2"]);
  });

  it("does not accept a docket that cites an invented clause", async () => {
    await expect(
      runAudit(ravi, async () => "", undefined, scripted([
        { name: "run_checks", input: { checks: ["C1"] } },
        { name: "submit_docket", input: { summary: "s", letter: "l", s13Request: "r", clauseIds: ["KA-99-9"] } },
      ])),
    ).rejects.toThrow(/without a docket/);
  });
});
