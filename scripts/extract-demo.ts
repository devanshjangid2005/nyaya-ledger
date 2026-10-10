/**
 * Real-model check of screenshot extraction: reads the 3 demo screenshots with the vision model
 * (through the Cline SDK) and compares them with the expected values in demo/data/ravi-week.json.
 * Run: npm run extract-demo
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { extractImage, type Extracted } from "../server/extract.js";
import { modelConfigFromEnv } from "../server/model.js";
import { mergeLedger } from "../server/ledger.js";
import { loadDemo } from "../server/demo-data.js";
import { CHECKS } from "../server/audit/checks.js";

const config = modelConfigFromEnv();
if (!config?.apiKey) {
  console.error("Missing MODEL_PROVIDER, MODEL_ID or API_KEY in .env.");
  process.exit(1);
}

const expected = JSON.parse(readFileSync(new URL("../demo/data/ravi-week.json", import.meta.url), "utf8"));
const ids = ["statement-1", "statement-2", "block-notice"];
let failures = 0;
const check = (what: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failures++;
  console.log(`  ${ok ? "✓" : "✗"} ${what}: ${JSON.stringify(got)}${ok ? "" : `  (expected ${JSON.stringify(want)})`}`);
};
const lineKey = (l: { kind: string; amount: number; orderId?: string }) => `${l.kind}:${l.amount}${l.orderId ? `:${l.orderId}` : ""}`;

console.log(`vision model: ${config.providerId}/${config.visionModelId}`);
const results = await Promise.all(
  ids.map(async (id) => {
    const t0 = Date.now();
    const buf = readFileSync(new URL(`../web/public/demo/${id}.png`, import.meta.url));
    const r = await extractImage(id, buf, "image/png", { kind: "provider", config });
    return { id, r, ms: Date.now() - t0 };
  }),
);

for (const { id, r, ms } of results) {
  console.log(`\n${id} (${(ms / 1000).toFixed(1)} s)`);
  if (r.status !== "ok") {
    failures++;
    console.log(`  ✗ unreadable: ${r.reason}`);
    continue;
  }
  if (id === "block-notice") {
    const want = expected.blockNotices[0];
    check("type", r.type, "block_notice");
    if (r.type === "block_notice") {
      check("noticeDate", r.data.noticeDate, want.noticeDate);
      check("effectiveDate", r.data.effectiveDate, want.effectiveDate);
      check("reasonText", r.data.reasonText, want.reasonText);
    }
    continue;
  }
  const want = expected.statements.find((s: { sourceImage: string }) => s.sourceImage === id);
  check("type", r.type, "statement");
  if (r.type !== "statement") continue;
  const s = (r as Extract<Extracted, { type: "statement" }>).data;
  check("period", [s.periodStart, s.periodEnd], [want.periodStart, want.periodEnd]);
  // statement-2 is a "continued" page with no payout date printed; the model must leave it empty.
  check("payoutDate", s.payoutDate ?? null, id === "statement-1" ? want.payoutDate : null);
  check("netPayoutShown", s.netPayoutShown, want.netPayoutShown);
  check("lines (kind:amount:orderId)", s.lines.map(lineKey).sort(), want.lines.map(lineKey).sort());
  // Some models append the sub-line "Order #KA-…" to the label; that changes no finding, so ignore it.
  const norm = (label: string) => label.replace(/\s+Order #\S+$/i, "").trim();
  check("labels", s.lines.map((l) => norm(l.label)).sort(), want.lines.map((l: { label: string }) => l.label).sort());
}

// End-to-end: the audit checks on the model-extracted ledger must match the hand-made demo ledger.
const { ledger: demo } = loadDemo();
const merged = mergeLedger(results.map((x) => x.r), demo.bankCredits, demo.inputs);
console.log("\naudit checks on the extracted ledger");
for (const id of ["C1", "C2", "C3", "C4", "C5", "C7"] as const) {
  const got = CHECKS[id](merged).map((f) => `${f.status}: ${f.title}`);
  check(id, got, CHECKS[id](demo).map((f) => `${f.status}: ${f.title}`));
}

console.log(`\n${failures === 0 ? "PASS" : `FAIL (${failures} mismatches)`}`);
process.exit(failures === 0 ? 0 : 1);
