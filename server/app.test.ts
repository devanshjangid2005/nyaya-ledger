import { describe, it, expect, afterAll } from "vitest";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { createApp } from "./app.js";
import { loadDemo } from "./demo-data.js";
import type { ModelSource } from "./model.js";

/** Stub agent model that first asks the worker a question, then runs checks and submits. */
function askingModel(): ModelSource {
  let i = 0;
  const calls = [
    { name: "ask_worker", input: { question: "Was the Adjustment explained anywhere?" } },
    { name: "run_checks", input: { checks: ["C1", "C2", "C3", "C4", "C5", "C7"] } },
    { name: "submit_docket", input: { summary: "s", letter: "ಪತ್ರ", s13Request: "r", clauseIds: ["KA-15-1"] } },
  ];
  return {
    kind: "stub",
    model: {
      async *stream() {
        const c = calls[Math.min(i++, calls.length - 1)];
        yield { type: "tool-call-delta", toolCallId: `c${i}`, toolName: c.name, inputText: JSON.stringify(c.input) };
        yield { type: "finish", reason: "tool-calls" };
      },
    } as any,
  };
}

const servers: Server[] = [];
async function start(source: ModelSource | null) {
  const server = createApp({ source, staticDir: "__none__" }).listen(0);
  servers.push(server);
  await new Promise((r) => server.once("listening", r));
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}
afterAll(() => servers.forEach((s) => s.close()));

/** Read an SSE stream; `onEvent` may act (e.g. POST an answer) while the stream is open. */
async function readSse(res: Response, onEvent: (event: string, data: any) => Promise<void> | void) {
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  const events: { event: string; data: any }[] = [];
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf("\n\n")) >= 0) {
      const chunk = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      const ev = /^event: (.+)$/m.exec(chunk)?.[1];
      const data = /^data: (.+)$/m.exec(chunk)?.[1];
      if (!ev || !data) continue;
      const parsed = JSON.parse(data);
      events.push({ event: ev, data: parsed });
      await onEvent(ev, parsed);
    }
  }
  return events;
}

describe("HTTP API", () => {
  it("reports health and serves demo data", async () => {
    const base = await start(null);
    expect(await (await fetch(`${base}/api/health`)).json()).toEqual({ ok: true, ai: false, model: null });
    const demo = await (await fetch(`${base}/api/demo`)).json();
    expect(demo.ledger.statements).toHaveLength(2);
    expect(demo.smsText).toContain("QUICKBITE");
  });

  it("parses pasted SMS", async () => {
    const base = await start(null);
    const { smsText } = await (await fetch(`${base}/api/demo`)).json();
    const r = await (await fetch(`${base}/api/sms`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: smsText, platform: "quickbite" }) })).json();
    expect(r.credits).toHaveLength(3);
    expect(r.skipped).toHaveLength(2);
  });

  it("rejects an invalid ledger", async () => {
    const base = await start(null);
    const res = await fetch(`${base}/api/audit`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ledger: { statements: "x" } }) });
    expect(res.status).toBe(400);
  });

  it("streams an audit, round-trips ask_worker, and returns a docket", async () => {
    const base = await start(askingModel());
    const { ledger } = loadDemo();
    let sessionId = "";
    let answered = false;
    const res = await fetch(`${base}/api/audit`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ledger }) });
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    const events = await readSse(res, async (event, data) => {
      if (event === "session") sessionId = data.sessionId;
      if (event === "question") {
        const r = await (await fetch(`${base}/api/answer`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId, answer: "No" }) })).json();
        answered = r.ok;
      }
    });
    expect(answered).toBe(true);
    const names = events.map((e) => e.event);
    expect(names[0]).toBe("session");
    expect(names).toContain("step");
    const docket = events.find((e) => e.event === "docket")!.data;
    expect(docket.generatedBy).toBe("agent");
    expect(docket.findings.filter((f: any) => f.status === "possible_issue")).toHaveLength(5);
  });

  it("still returns a docket with no model configured (fallback)", async () => {
    const base = await start(null);
    const { ledger } = loadDemo();
    const res = await fetch(`${base}/api/audit`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ledger }) });
    const events = await readSse(res, () => {});
    expect(events.map((e) => e.event)).toEqual(["session", "fallback", "docket"]);
    expect(events[2].data.generatedBy).toBe("fallback");
  });

  it("extract returns unreadable placeholders when no model is configured", async () => {
    const base = await start(null);
    const fd = new FormData();
    fd.append("images", new Blob([Buffer.from("89504e470d0a1a0a", "hex")], { type: "image/png" }), "a.png");
    const r = await (await fetch(`${base}/api/extract`, { method: "POST", body: fd })).json();
    expect(r.results[0]).toMatchObject({ id: "img-1", status: "unreadable" });
  });
});
