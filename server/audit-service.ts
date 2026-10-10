import type { Ledger } from "../shared/schema.js";
import { runAudit, type AgentEvent, type DocketDraft } from "./agent.js";
import { fallbackDocket } from "./fallback.js";
import { modelConfigFromEnv, type ModelSource } from "./model.js";

export interface AuditRequest {
  ledger: Ledger;
  askWorker?: (q: string) => Promise<string>;
  onEvent?: (e: AgentEvent | { type: "fallback"; reason: string }) => void;
  signal?: AbortSignal;
  /** Tests inject a stub model; otherwise env decides. */
  source?: ModelSource | null;
  timeoutMs?: number;
}

/**
 * Run the Cline SDK agent; if no model is configured or the run fails or times out,
 * return the deterministic fallback so the worker always gets a docket.
 */
export async function auditWithFallback(req: AuditRequest): Promise<DocketDraft> {
  const config = modelConfigFromEnv();
  const source: ModelSource | null = req.source !== undefined ? req.source : config ? { kind: "provider", config } : null;

  if (!source) {
    const reason = "no model configured";
    req.onEvent?.({ type: "fallback", reason });
    return fallbackDocket(req.ledger, reason);
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), req.timeoutMs ?? 120_000);
  const relay = () => ctrl.abort();
  req.signal?.addEventListener("abort", relay, { once: true });

  try {
    return await runAudit({ ledger: req.ledger, source, askWorker: req.askWorker, onEvent: req.onEvent, signal: ctrl.signal });
  } catch (err) {
    if (req.signal?.aborted) throw err; // client went away: don't do extra work
    const reason = ctrl.signal.aborted ? "model timed out" : `model error: ${(err as Error).message}`.slice(0, 200);
    req.onEvent?.({ type: "fallback", reason });
    return fallbackDocket(req.ledger, reason);
  } finally {
    clearTimeout(timer);
    req.signal?.removeEventListener("abort", relay);
  }
}
