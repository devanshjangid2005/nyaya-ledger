// Builds docs/Nyaya-Ledger.pptx. Run from docs/deck:  npm install && npm run build
// Missing screenshots in shots/ become labelled placeholders; drop the PNGs in and re-run.
import { join } from "node:path";
import { tmpdir } from "node:os";
import pptxgen from "pptxgenjs";
import QRCode from "qrcode";
import { HERE, LIVE, TOTAL, missing, slideCount } from "./lib.mjs";
import s01 from "./s01-title.mjs";
import s02 from "./s02-problem.mjs";
import s03 from "./s03-voice.mjs";
import s04 from "./s04-why-now.mjs";
import s05 from "./s05-solution.mjs";
import s06 from "./s06-demo.mjs";
import s07 from "./s07-architecture.mjs";
import s08 from "./s08-ai.mjs";
import s09 from "./s09-cline.mjs";
import s10 from "./s10-challenges.mjs";
import s11 from "./s11-future.mjs";

const qrPath = join(tmpdir(), "nyaya-ledger-qr.png");
await QRCode.toFile(qrPath, LIVE, { width: 600, margin: 1, color: { dark: "#0B5CAD", light: "#FFFFFF" } });

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in, 16:9
pptx.title = "Nyaya-Ledger";
pptx.subject = "Cline AI Builder Hackathon, Round 2";
pptx.author = "Devansh Jangid, Debasis Patnaik";
pptx.company = "Nyaya-Ledger";

for (const make of [s01, s02, s03, s04, s05, s06, s07, s08, s09, s10]) make(pptx);
s11(pptx, qrPath);
if (slideCount() !== TOTAL) throw new Error(`Built ${slideCount()} slides but TOTAL is ${TOTAL}; update TOTAL in lib.mjs`);

const out = join(HERE, "..", "Nyaya-Ledger.pptx");
await pptx.writeFile({ fileName: out });
console.log(`Wrote ${out}`);
console.log(missing.length ? `Placeholders still empty (${missing.length}): ${missing.join(", ")}` : "All screenshot slots filled.");
