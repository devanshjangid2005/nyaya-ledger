import "dotenv/config";
import express from "express";

// Phase 0 skeleton. Routes (/api/extract, /api/sms, /api/audit, /api/answer, /api/docket.pdf, /api/demo) arrive in Phase 2-4.
const app = express();
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, provider: process.env.MODEL_PROVIDER ?? null, model: process.env.MODEL_ID ?? null });
});

const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => console.log(`Nyaya-Ledger API on http://localhost:${port}`));
