/**
 * Phase 0 smoke test: proves MODEL_PROVIDER / MODEL_ID / API_KEY work with the Cline SDK.
 * Run: npm run smoke
 */
import "dotenv/config";
import { createAgent, modelConfigFromEnv } from "../server/model.js";

const config = modelConfigFromEnv();
if (!config || !config.apiKey) {
  console.error("Missing MODEL_PROVIDER, MODEL_ID or API_KEY in .env (copy .env.example to .env).");
  process.exit(1);
}

const agent = createAgent({ kind: "provider", config }, { maxIterations: 1, systemPrompt: "Reply in one short line." });

const started = Date.now();
const res = await agent.run("Say 'Namaskara, Nyaya-Ledger is ready' in Kannada script, then in English.");
console.log(`provider=${config.providerId} model=${config.modelId} status=${res.status} (${Date.now() - started} ms)`);
console.log(res.outputText || res.error?.message);
process.exit(res.status === "completed" && res.outputText ? 0 : 1);
