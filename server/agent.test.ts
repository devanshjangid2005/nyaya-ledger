import { describe, it, expect } from "vitest";
import { loadDemo } from "./demo-data.js";
import { applicableChecks, runAudit } from "./agent.js";
import { auditWithFallback } from "./audit-service.js";
import type { ModelSource } from "./model.js";

const { ledger: ravi } = loadDemo();

/** Stub model: scripted tool calls, one per turn. Exercises the real SDK loop without an API key. */
function scripted(calls: { name: string; input: unknown }[]): ModelSource {
  let i = 0;
  return {
    kind: "stub",
    model: {
      async *stream() {
        const c = calls[Math.min(i, calls.length - 1)];
        i++;
        yield { type: "tool-call-delta", toolCallId: `c${i}`, toolName: c.name, inputText: JSON.stringify(c.input) };
        yield { type: "finish", reason: "tool-calls" };
      },
    } as any,
  };
}

const failing: ModelSource = {
  kind: "stub",
  model: {
    async *stream() {
      throw new Error("429 rate limited");
    },
  } as any,
};

const SUBMIT = { name: "submit_docket", input: { summary: "s", letter: "ಪತ್ರ", s13Request: "r", clauseIds: ["KA-15-1"] } };

describe("applicableChecks", () => {
  it("selects every check for the demo ledger", () => {
    expect(applicableChecks(ravi)).toEqual(["C1", "C2", "C3", "C4", "C5", "C7"]);
  });
});

describe("runAudit with Cline SDK Agent", () => {
  it("runs checks via tools and produces a docket with verified citations", async () => {
    const tools: string[] = [];
    const draft = await runAudit({
      ledger: ravi,
      source: scripted([
        { name: "get_ledger_summary", input: {} },
        { name: "run_checks", input: { checks: ["C1", "C2", "C3", "C4", "C5", "C7"] } },
        { name: "lookup_clause", input: { id: "KA-15-1" } },
        SUBMIT,
      ]),
      onEvent: (e) => e.type === "tool" && tools.push(e.tool),
    });
    expect(tools).toEqual(["get_ledger_summary", "run_checks", "lookup_clause", "submit_docket"]);
    // C1 ×2 (Adjustment, Other), C2 gap ₹120, C3 block notice, C7 bank short ₹100
    expect(draft.findings.filter((f) => f.status === "possible_issue")).toHaveLength(5);
    expect(draft.citations.map((c) => c.id).sort()).toEqual(["KA-14-2", "KA-15-1", "KA-22-2"]);
    expect(draft.generatedBy).toBe("agent");
  });

  it("does not double-count when run_checks is called twice", async () => {
    const draft = await runAudit({
      ledger: ravi,
      source: scripted([
        { name: "run_checks", input: { checks: ["C1", "C2"] } },
        { name: "run_checks", input: { checks: ["C1", "C2", "C7"] } },
        SUBMIT,
      ]),
    });
    expect(draft.findings.filter((f) => f.checkId === "C1")).toHaveLength(2);
    expect(draft.findings.filter((f) => f.checkId === "C7")).toHaveLength(1);
  });

  it("rejects invalid tool input instead of running it", async () => {
    const done: { tool: string; isError: boolean }[] = [];
    await expect(
      runAudit({
        ledger: ravi,
        source: scripted([{ name: "run_checks", input: { checks: ["C9"] } }, { name: "submit_docket", input: { summary: "" } }]),
        onEvent: (e) => {
          if (e.type === "tool-done") done.push({ tool: e.tool, isError: e.isError });
        },
      }),
    ).rejects.toThrow(/without a docket/);
    expect(done[0]).toEqual({ tool: "run_checks", isError: true });
  });

  it("does not accept a docket that cites an invented clause", async () => {
    await expect(
      runAudit({
        ledger: ravi,
        source: scripted([
          { name: "run_checks", input: { checks: ["C1"] } },
          { name: "submit_docket", input: { summary: "s", letter: "l", s13Request: "r", clauseIds: ["KA-99-9"] } },
        ]),
      }),
    ).rejects.toThrow(/without a docket/);
  });
});

describe("auditWithFallback", () => {
  it("falls back to the deterministic docket when the model fails", async () => {
    const events: string[] = [];
    const draft = await auditWithFallback({ ledger: ravi, source: failing, onEvent: (e) => events.push(e.type) });
    expect(draft.generatedBy).toBe("fallback");
    expect(events).toContain("fallback");
    expect(draft.findings.filter((f) => f.status === "possible_issue")).toHaveLength(5);
    expect(draft.letter).toContain("Internal Dispute Resolution Committee");
    expect(draft.letter).toContain("Karnataka High Court");
    expect(draft.s13Request).toContain('"Adjustment" of ₹180');
  });

  it("falls back when no model is configured", async () => {
    const draft = await auditWithFallback({ ledger: ravi, source: null });
    expect(draft.generatedBy).toBe("fallback");
    expect(draft.summary).toContain("no model configured");
  });
});
