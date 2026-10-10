/**
 * Phase 1 CLI demo: runs the full audit on the synthetic demo data, no UI.
 * Run: npm run demo            (uses MODEL_* from .env; falls back to no-AI docket if unset)
 *      npm run demo -- --lang en
 */
import "dotenv/config";
import { loadDemo } from "./demo-data.js";
import { auditWithFallback } from "./audit-service.js";
import { modelConfigFromEnv } from "./model.js";

const langArg = process.argv.indexOf("--lang");
const lang = langArg > 0 ? process.argv[langArg + 1] : undefined;

const { ledger, sms } = loadDemo();
if (lang === "kn" || lang === "hi" || lang === "en") ledger.inputs.language = lang;

const cfg = modelConfigFromEnv();
console.log(`\n== Nyaya-Ledger demo · model: ${cfg ? `${cfg.providerId}/${cfg.modelId}` : "none (fallback)"} · language: ${ledger.inputs.language}`);
console.log(`SMS: ${sms.credits.length} credits kept, ${sms.skipped.length} skipped (${sms.skipped.map((s) => s.reason).join(", ")})\n`);

const t0 = Date.now();
const draft = await auditWithFallback({
  ledger,
  askWorker: async (q) => {
    console.log(`  ? AGENT ASKS: ${q}  → (demo answers "skip")`);
    return "skip";
  },
  onEvent: (e) => {
    if (e.type === "tool") console.log(`  → ${e.tool}${e.tool === "lookup_clause" || e.tool === "run_checks" ? ` ${JSON.stringify(e.input)}` : ""}`);
    if (e.type === "tool-done" && e.isError) console.log(`  ✗ ${e.tool} returned an error (agent will retry)`);
    if (e.type === "fallback") console.log(`  ! fallback: ${e.reason}`);
  },
});

const icon = { possible_issue: "⚠", ok: "✓", info: "ℹ", needs_input: "?" } as const;
console.log(`\n== Findings (${draft.generatedBy}, ${((Date.now() - t0) / 1000).toFixed(1)} s)`);
for (const f of draft.findings) console.log(`${icon[f.status]} [${f.checkId}] ${f.title}\n     ${f.arithmetic}\n     evidence: ${f.evidence.join(", ") || "-"}`);
console.log(`\n== Summary\n${draft.summary}`);
console.log(`\n== Grievance letter\n${draft.letter}`);
console.log(`\n== s.13(1) request\n${draft.s13Request}`);
console.log(`\n== Citations: ${draft.citations.map((c) => c.id).join(", ")}`);
const issues = draft.findings.filter((f) => f.status === "possible_issue").length;
console.log(`\nPossible issues: ${issues}`);
process.exit(issues === 5 ? 0 : 1);
