import { describe, it, expect } from "vitest";
import { extractImage } from "./extract.js";
import { mergeLedger } from "./ledger.js";
import { loadDemo } from "./demo-data.js";
import { CHECKS } from "./audit/checks.js";
import type { ModelSource } from "./model.js";

const PNG = Buffer.from("89504e470d0a1a0a", "hex");

/** Stub vision model that records the given inputs in order (one per turn) and captures what it was sent. */
function vision(records: unknown[], seen: unknown[] = []): ModelSource {
  let i = 0;
  return {
    kind: "stub",
    model: {
      async *stream(req: any) {
        seen.push(req);
        const input = records[Math.min(i, records.length - 1)];
        i++;
        yield { type: "tool-call-delta", toolCallId: `r${i}`, toolName: "record_screenshot", inputText: JSON.stringify(input) };
        yield { type: "finish", reason: "tool-calls" };
      },
    } as any,
  };
}

const GOOD_STATEMENT = {
  type: "statement",
  statement: {
    periodStart: "2026-09-29",
    periodEnd: "2026-10-05",
    netPayoutShown: 6105,
    lines: [{ kind: "deduction", label: "Adjustment", amount: 180 }],
  },
};

describe("extractImage", () => {
  it("records a statement and stamps every line with the image id", async () => {
    const seen: any[] = [];
    const r = await extractImage("statement-2", PNG, "image/png", vision([GOOD_STATEMENT], seen));
    expect(r.status).toBe("ok");
    if (r.status !== "ok" || r.type !== "statement") throw new Error("expected statement");
    expect(r.data.sourceImage).toBe("statement-2");
    expect(r.data.lines[0].sourceImage).toBe("statement-2");
    // the image was actually sent to the model as an image part
    expect(JSON.stringify(seen[0])).toContain("image");
  });

  it("retries once after invalid output, then succeeds", async () => {
    const r = await extractImage("s1", PNG, "image/png", vision([{ type: "statement", statement: { netPayoutShown: "lots" } }, GOOD_STATEMENT]));
    expect(r.status).toBe("ok");
  });

  it("returns unreadable (never throws) after two invalid outputs", async () => {
    const r = await extractImage("s1", PNG, "image/png", vision([{ type: "bogus" }]));
    expect(r.status).toBe("unreadable");
  });

  it("rejects unsupported types and oversize images without calling the model", async () => {
    const seen: unknown[] = [];
    expect((await extractImage("x", PNG, "image/gif", vision([GOOD_STATEMENT], seen))).status).toBe("unreadable");
    expect((await extractImage("x", Buffer.alloc(5 * 1024 * 1024), "image/png", vision([GOOD_STATEMENT], seen))).status).toBe("unreadable");
    expect(seen).toHaveLength(0);
  });
});

describe("mergeLedger", () => {
  it("rebuilds the demo ledger from extracted screenshots + SMS with identical findings", () => {
    const { ledger: demo } = loadDemo();
    const extracted = [
      ...demo.statements.map((s) => ({ id: s.sourceImage, status: "ok" as const, type: "statement" as const, data: s })),
      ...demo.blockNotices.map((n) => ({ id: n.sourceImage, status: "ok" as const, type: "block_notice" as const, data: n })),
      { id: "penalty", status: "ok" as const, type: "other" as const, note: "penalty detail" },
      { id: "blurry", status: "unreadable" as const, reason: "blurred" },
    ];
    const merged = mergeLedger(extracted, demo.bankCredits, demo.inputs);
    for (const id of ["C1", "C2", "C3", "C4", "C5", "C7"] as const) expect(CHECKS[id](merged)).toEqual(CHECKS[id](demo));
  });
});
