/**
 * Builds the 3 synthetic demo screenshots for the fictional brand "QuickBite Partner"
 * (no real platform branding) from demo/data/ravi-week.json, so numbers always match the tests.
 * Writes HTML to demo/screens/ and PNGs to web/public/demo/ using a locally installed Chrome/Edge.
 * Run: npm run screens
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Ledger } from "../shared/schema.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const ledger = Ledger.parse(JSON.parse(readFileSync(`${root}demo/data/ravi-week.json`, "utf8")));
const htmlDir = `${root}demo/screens`;
const pngDir = `${root}web/public/demo`;
mkdirSync(htmlDir, { recursive: true });
mkdirSync(pngDir, { recursive: true });

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const day = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const shell = (title: string, body: string) => `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box}body{margin:0;width:390px;height:844px;font-family:Segoe UI,Roboto,Arial,sans-serif;background:#f4f5f7;color:#1d2433}
.bar{height:24px;background:#111;color:#fff;font-size:12px;padding:4px 14px;display:flex;justify-content:space-between}
.top{background:#ff7a1a;color:#fff;padding:14px 16px}.top b{font-size:18px}.top small{display:block;opacity:.9}
.card{background:#fff;margin:12px;border-radius:12px;padding:14px;box-shadow:0 1px 2px rgba(0,0,0,.08)}
.row{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #eef0f3;font-size:15px}
.row small{display:block;color:#7a8394;font-size:12px}.neg{color:#c0392b}.big{font-size:26px;font-weight:700}
.muted{color:#7a8394;font-size:13px}.alert{background:#fdecea;border-left:4px solid #c0392b}
.watermark{position:fixed;bottom:8px;width:100%;text-align:center;font-size:11px;color:#a0a7b4}
</style></head><body><div class="bar"><span>9:41</span><span>4G ▮▮▮</span></div>
<div class="top"><b>QuickBite Partner</b><small>${title}</small></div>${body}
<div class="watermark">SYNTHETIC DEMO DATA · fictional brand</div></body></html>`;

function statementHtml(i: number): string {
  const s = ledger.statements[i];
  const rows = s.lines
    .map((l) => {
      const sign = l.kind === "deduction" ? "−" : "";
      const sub = l.orderId && l.kind !== "deduction" ? `<small>Order #${l.orderId}</small>` : "";
      return `<div class="row"><span>${l.label}${sub}</span><span class="${l.kind === "deduction" ? "neg" : ""}">${sign}${inr(l.amount)}</span></div>`;
    })
    .join("");
  const head =
    i === 0
      ? `<div class="card"><div class="muted">Weekly payout · ${day(s.periodStart)} – ${day(s.periodEnd)}</div><div class="big">${inr(s.netPayoutShown)}</div><div class="muted">Net payout · paid on ${day(s.payoutDate ?? s.periodEnd)}</div></div>`
      : `<div class="card"><div class="muted">${day(s.periodStart)} – ${day(s.periodEnd)} · continued</div></div>`;
  const foot = i === 1 ? `<div class="card"><div class="row" style="border:0"><b>Net payout</b><b>${inr(s.netPayoutShown)}</b></div></div>` : "";
  return shell("Earnings", `${head}<div class="card">${rows}</div>${foot}`);
}

function noticeHtml(): string {
  const n = ledger.blockNotices[0];
  return shell(
    "Notifications",
    `<div class="card alert"><b>Your ID has been temporarily blocked</b>
     <p class="muted">${day(n.noticeDate)} · 10:42 AM</p>
     <p>Your partner ID has been blocked with immediate effect. You will not receive new orders.</p>
     ${n.reasonText ? `<p>Reason: ${n.reasonText}</p>` : ""}
     <p class="muted">For queries, contact partner support in the app.</p></div>`,
  );
}

const screens: Record<string, string> = { "statement-1": statementHtml(0), "statement-2": statementHtml(1), "block-notice": noticeHtml() };

const candidates = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean) as string[];
const browser = candidates.find((p) => existsSync(p));

for (const [id, html] of Object.entries(screens)) {
  const htmlPath = `${htmlDir}/${id}.html`;
  writeFileSync(htmlPath, html);
  if (!browser) continue;
  execFileSync(browser, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1", "--window-size=390,844", `--screenshot=${pngDir}/${id}.png`, pathToFileURL(htmlPath).href], { stdio: "ignore" });
  console.log(`wrote web/public/demo/${id}.png`);
}
if (!browser) console.log("No Chrome/Edge found: HTML written to demo/screens/, PNGs skipped. Set CHROME_PATH.");
