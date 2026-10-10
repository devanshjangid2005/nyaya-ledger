import "dotenv/config";
import { createApp } from "./app.js";
import { modelConfigFromEnv } from "./model.js";

const port = Number(process.env.PORT ?? 8787);
const cfg = modelConfigFromEnv();
createApp().listen(port, "0.0.0.0", () => {
  console.log(`Nyaya-Ledger on http://localhost:${port}`);
  console.log(cfg ? `AI: ${cfg.providerId}/${cfg.modelId} (vision: ${cfg.visionModelId})` : "AI: not configured, using deterministic fallback");
});
