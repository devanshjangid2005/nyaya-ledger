/**
 * Phase 0 smoke test: proves MODEL_PROVIDER / MODEL_ID / API_KEY work with the Cline SDK.
 * Run: npm run smoke
 */
import "dotenv/config";
import { Agent } from "@cline/sdk";

const { MODEL_PROVIDER, MODEL_ID, API_KEY } = process.env;
if (!MODEL_PROVIDER || !MODEL_ID || !API_KEY) {
  console.error("Missing MODEL_PROVIDER, MODEL_ID or API_KEY in .env (copy .env.example to .env).");
  process.exit(1);
}

const agent = new Agent({
  providerId: MODEL_PROVIDER,
  modelId: MODEL_ID,
  apiKey: API_KEY,
  maxIterations: 1,
  systemPrompt: "Reply in one short line.",
});

const started = Date.now();
const res = await agent.run("Say 'Namaskara, Nyaya-Ledger is ready' in Kannada script, then in English.");
console.log(`provider=${MODEL_PROVIDER} model=${MODEL_ID} status=${res.status} (${Date.now() - started} ms)`);
console.log(res.outputText || res.error?.message);
process.exit(res.status === "completed" && res.outputText ? 0 : 1);
