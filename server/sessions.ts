import { randomUUID } from "node:crypto";

/**
 * In-memory bridge for the agent's ask_worker tool: the audit stream waits on a promise
 * that /api/answer resolves. Single instance only (Render free tier = 1 instance).
 */
interface Pending {
  resolve: (answer: string) => void;
  timer: NodeJS.Timeout;
}

const pending = new Map<string, Pending>();
export const ANSWER_TIMEOUT_MS = 90_000;

export function newSessionId(): string {
  return randomUUID();
}

export function waitForAnswer(sessionId: string, timeoutMs = ANSWER_TIMEOUT_MS): Promise<string> {
  cancelQuestion(sessionId);
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(sessionId);
      resolve("The worker did not answer. Continue without this information.");
    }, timeoutMs);
    pending.set(sessionId, { resolve, timer });
  });
}

export function answerQuestion(sessionId: string, answer: string): boolean {
  const p = pending.get(sessionId);
  if (!p) return false;
  clearTimeout(p.timer);
  pending.delete(sessionId);
  p.resolve(answer.slice(0, 500));
  return true;
}

export function cancelQuestion(sessionId: string): void {
  const p = pending.get(sessionId);
  if (!p) return;
  clearTimeout(p.timer);
  pending.delete(sessionId);
  p.resolve("The worker left. Finish without this information.");
}

/** Tiny fixed-window rate limiter per IP, so a public demo link cannot burn the model budget. */
export function rateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, { count: number; reset: number }>();
  return (key: string): boolean => {
    const now = Date.now();
    const h = hits.get(key);
    if (!h || h.reset < now) {
      hits.set(key, { count: 1, reset: now + windowMs });
      if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
      return true;
    }
    h.count++;
    return h.count <= limit;
  };
}
