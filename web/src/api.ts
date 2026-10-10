import type { BankCredit, Finding, Ledger } from "../../shared/schema";

export type { BankCredit, Finding, Ledger };
export type Lang = "kn" | "hi" | "en";

export interface DocketDraft {
  summary: string;
  findings: Finding[];
  letter: string;
  s13Request: string;
  citations: { id: string; text: string }[];
  generatedBy: "agent" | "fallback";
}

export type Extracted =
  | { id: string; status: "ok"; type: "statement"; data: Ledger["statements"][number] }
  | { id: string; status: "ok"; type: "block_notice"; data: Ledger["blockNotices"][number] }
  | { id: string; status: "ok"; type: "other"; note: string }
  | { id: string; status: "unreadable"; reason: string };

export interface SmsResult {
  credits: BankCredit[];
  skipped: { text: string; reason: string }[];
}

async function json<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error ?? `Request failed (${res.status})`);
  return body as T;
}

export const api = {
  health: () => fetch("/api/health").then((r) => json<{ ok: boolean; ai: boolean; model: string | null }>(r)),
  demo: () => fetch("/api/demo").then((r) => json<{ ledger: Ledger; smsText: string; platform: string }>(r)),
  sms: (text: string, platform: string) =>
    fetch("/api/sms", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, platform }) }).then((r) => json<SmsResult>(r)),
  extract: (files: File[]) => {
    const fd = new FormData();
    files.forEach((f) => fd.append("images", f));
    return fetch("/api/extract", { method: "POST", body: fd }).then((r) => json<{ results: Extracted[] }>(r));
  },
  answer: (sessionId: string, answer: string) =>
    fetch("/api/answer", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId, answer }) }).then((r) => json<{ ok: boolean }>(r)),
};

export interface AuditHandlers {
  onSession: (id: string) => void;
  onStep: (tool: string) => void;
  onQuestion: (q: string) => void;
  onFallback: (reason: string) => void;
}

/** POST + Server-Sent Events reader (EventSource cannot POST). Resolves with the docket. */
export async function runAuditStream(ledger: Ledger, h: AuditHandlers, signal?: AbortSignal): Promise<DocketDraft> {
  const res = await fetch("/api/audit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ledger }), signal });
  if (!res.ok || !res.body) return json<never>(res);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i: number;
    while ((i = buf.indexOf("\n\n")) >= 0) {
      const chunk = buf.slice(0, i);
      buf = buf.slice(i + 2);
      const event = /^event: (.+)$/m.exec(chunk)?.[1];
      const raw = /^data: (.+)$/m.exec(chunk)?.[1];
      if (!event || !raw) continue;
      const data = JSON.parse(raw);
      if (event === "session") h.onSession(data.sessionId);
      else if (event === "step") h.onStep(data.tool);
      else if (event === "question") h.onQuestion(data.question);
      else if (event === "fallback") h.onFallback(data.reason);
      else if (event === "docket") return data as DocketDraft;
      else if (event === "error") throw new Error(data.error);
    }
  }
  throw new Error("The connection closed before the docket was ready. Please try again.");
}
