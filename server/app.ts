import express, { type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { Ledger } from "../shared/schema.js";
import { parseSms } from "./sms.js";
import { extractImage, MAX_IMAGE_BYTES, type Extracted } from "./extract.js";
import { auditWithFallback } from "./audit-service.js";
import { loadDemo } from "./demo-data.js";
import { modelConfigFromEnv, type ModelSource } from "./model.js";
import { answerQuestion, cancelQuestion, newSessionId, rateLimiter, waitForAnswer } from "./sessions.js";

export interface AppOptions {
  /** Override the model (tests). undefined = from env, null = no model. */
  source?: ModelSource | null;
  staticDir?: string;
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_IMAGE_BYTES, files: 8 } });
const SmsBody = z.object({ text: z.string().max(20_000), platform: z.string().max(60).optional() });
const AnswerBody = z.object({ sessionId: z.string().uuid(), answer: z.string().max(500) });

export function createApp(opts: AppOptions = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1); // Render sits behind one proxy; needed for per-IP rate limits
  app.use(express.json({ limit: "1mb" }));

  const source = (): ModelSource | null => {
    if (opts.source !== undefined) return opts.source;
    const config = modelConfigFromEnv();
    return config ? { kind: "provider", config } : null;
  };
  const modelLimit = rateLimiter(Number(process.env.RATE_LIMIT_PER_10MIN ?? 20), 10 * 60_000);
  const limited = (req: Request, res: Response, next: NextFunction) =>
    modelLimit(req.ip ?? "unknown") ? next() : res.status(429).json({ error: "Too many requests. Please wait a few minutes." });

  app.get("/api/health", (_req, res) => {
    const s = source();
    res.json({ ok: true, ai: s !== null, model: s?.kind === "provider" ? `${s.config.providerId}/${s.config.modelId}` : s ? "stub" : null });
  });

  app.get("/api/demo", (_req, res) => {
    const { ledger, smsText } = loadDemo();
    res.json({ ledger, smsText, platform: "QuickBite" });
  });

  app.post("/api/sms", (req, res) => {
    const body = SmsBody.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: z.prettifyError(body.error) });
    const hints = body.data.platform?.trim() ? [body.data.platform.trim()] : [];
    res.json(parseSms(body.data.text, { platformHints: hints }));
  });

  app.post("/api/extract", limited, upload.array("images", 8), async (req, res) => {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (files.length === 0) return res.status(400).json({ error: "No images uploaded." });
    const s = source();
    if (!s) return res.json({ results: files.map((f, i) => ({ id: `img-${i + 1}`, status: "unreadable", reason: "AI reading is not configured; please type the values." })) });
    const ctrl = new AbortController();
    res.on("close", () => !res.writableEnded && ctrl.abort());
    // Sequential: keeps memory low on a 512 MB instance and stays inside provider rate limits.
    const results: Extracted[] = [];
    for (const [i, f] of files.entries()) results.push(await extractImage(`img-${i + 1}`, f.buffer, f.mimetype, s, ctrl.signal));
    res.json({ results });
  });

  app.post("/api/audit", limited, async (req, res) => {
    const parsed = Ledger.safeParse(req.body?.ledger);
    if (!parsed.success) return res.status(400).json({ error: z.prettifyError(parsed.error) });

    const sessionId = newSessionId();
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" });
    const send = (event: string, data: unknown) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    const ping = setInterval(() => res.write(": ping\n\n"), 15_000);
    const ctrl = new AbortController();
    res.on("close", () => {
      if (!res.writableEnded) ctrl.abort();
      cancelQuestion(sessionId);
    });

    send("session", { sessionId });
    try {
      const draft = await auditWithFallback({
        ledger: parsed.data,
        source: source(),
        signal: ctrl.signal,
        askWorker: (question) => {
          send("question", { question });
          return waitForAnswer(sessionId);
        },
        onEvent: (e) => {
          if (e.type === "tool") send("step", { tool: e.tool });
          else if (e.type === "tool-done") send("step-done", e);
          else if (e.type === "fallback") send("fallback", e);
        },
      });
      send("docket", draft);
    } catch (err) {
      if (!ctrl.signal.aborted) send("error", { error: (err as Error).message });
    } finally {
      clearInterval(ping);
      res.end();
    }
  });

  app.post("/api/answer", (req, res) => {
    const body = AnswerBody.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: "Invalid answer." });
    res.json({ ok: answerQuestion(body.data.sessionId, body.data.answer) });
  });

  // Upload errors (size/count) → 400 instead of 500.
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError) return res.status(400).json({ error: `Upload error: ${err.message}` });
    next(err);
  });

  // Production: serve the built web app from the same origin.
  const staticDir = opts.staticDir ?? fileURLToPath(new URL("../web/dist", import.meta.url));
  if (existsSync(staticDir)) {
    app.use(express.static(staticDir, { index: "index.html", maxAge: "1h" }));
    app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile("index.html", { root: staticDir }));
  }
  return app;
}
