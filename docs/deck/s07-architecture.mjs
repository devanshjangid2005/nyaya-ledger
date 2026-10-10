// Slide 7: architecture (editable boxes, mirrors the README mermaid diagram).
import { C, F, M, W, frame } from "./lib.mjs";
import { arrow, box, chip, label } from "./parts.mjs";

export default function (pptx) {
  const s = frame(pptx, "Architecture", "AI reads and writes. Code decides the numbers.");
  const R1 = 1.75; // row 1 top
  const R2 = 3.95; // row 2 top
  const RX = 9.9; // right column x
  const RW = W - M - RX;

  // Row 1: collect → read → confirm → docket
  box(pptx, s, { x: M, y: R1, w: 2.2, h: 1.6, tone: "worker", title: "Worker", body: "Phone browser, React + Vite. Kannada, Hindi or English" });
  box(pptx, s, { x: 3.3, y: R1, w: 3.0, h: 0.75, tone: "ai", title: "Vision model", body: "1 call per screenshot → zod-checked JSON", titleSize: 12, bodySize: 10 });
  box(pptx, s, { x: 3.3, y: R1 + 0.85, w: 3.0, h: 0.75, tone: "code", title: "SMS parser  ·  no AI", body: "Keeps bank credits, skips OTPs and debits", titleSize: 12, bodySize: 10 });
  box(pptx, s, { x: 6.8, y: R1, w: 2.6, h: 1.6, tone: "worker", title: "Confirm", body: "The worker checks and fixes every number. Only confirmed data goes on" });
  box(pptx, s, { x: RX, y: R1, w: RW, h: 1.6, tone: "worker", title: "Docket", body: "Findings, letter, s.13 request, quoted clauses. Browser \"Save as PDF\" with Noto fonts" });
  arrow(pptx, s, 2.8, R1 + 0.37, 3.3, R1 + 0.37);
  arrow(pptx, s, 2.8, R1 + 1.22, 3.3, R1 + 1.22);
  arrow(pptx, s, 6.3, R1 + 0.37, 6.8, R1 + 0.37);
  arrow(pptx, s, 6.3, R1 + 1.22, 6.8, R1 + 1.22);
  arrow(pptx, s, 8.1, R1 + 1.6, 8.1, R2);

  // Row 2: the agent and its tools
  s.addShape(pptx.ShapeType.roundRect, { x: 3.3, y: R2, w: 6.1, h: 1.85, rectRadius: 0.08, fill: { color: C.brandBg }, line: { color: C.brand, width: 1.5 } });
  s.addText(
    [
      { text: "Cline SDK Agent", options: { fontFace: F.head, fontSize: 14, color: C.brand, breakLine: true } },
      { text: "Picks the checks that apply, asks the worker if something is missing, explains the findings and writes the letter. Only 5 custom tools: no shell, file or web.", options: { fontFace: F.body, fontSize: 10.5, color: C.muted } },
    ],
    { x: 3.45, y: R2 + 0.1, w: 3.95, h: 1.15, valign: "top", margin: 0, paraSpaceAfter: 3 },
  );
  let cx = 3.45;
  cx += chip(pptx, s, "get_ledger_summary", cx, R2 + 1.35, { mono: true, size: 9, h: 0.3, bg: C.white, line: C.brandLine }) + 0.08;
  chip(pptx, s, "ask_worker", cx, R2 + 1.35, { mono: true, size: 9, h: 0.3, bg: C.white, line: C.brandLine });
  const tools = [
    ["submit_docket", "Citation + verdict guard", "Unknown clause or \"violation\" → rejected"],
    ["run_checks", "Audit checks C1-C5, C7", "Pure functions, unit-tested"],
    ["lookup_clause", "Legal corpus", "Verbatim text of the Act"],
  ];
  tools.forEach(([tool, title, body], i) => {
    const y = R2 + i * 0.63;
    chip(pptx, s, tool, 7.6, y + 0.13, { w: 1.65, mono: true, size: 9, h: 0.3, bg: C.white, line: C.brandLine });
    box(pptx, s, { x: RX, y, w: RW, h: 0.57, tone: "code", title, body, titleSize: 10.5, bodySize: 9 });
    arrow(pptx, s, 9.4, y + 0.28, RX, y + 0.28);
  });
  arrow(pptx, s, RX + RW / 2, R2, RX + RW / 2, R1 + 1.6);

  // Fallback
  s.addText(
    [
      { text: "Fallback", options: { fontFace: F.head, fontSize: 12, color: C.ink, breakLine: true } },
      { text: "No model, an error or 120 s → English template docket. Same checks, same guard", options: { fontFace: F.body, fontSize: 10, color: C.muted } },
    ],
    { shape: pptx.ShapeType.roundRect, x: M, y: R2, w: 2.2, h: 1.85, rectRadius: 0.08, fill: { color: C.white }, line: { color: C.dash, width: 1, dashType: "dash" }, margin: 10, valign: "top", paraSpaceAfter: 3 },
  );
  arrow(pptx, s, 3.3, R2 + 0.92, 2.8, R2 + 0.92, { dash: true });

  // Stack
  label(s, "Stack", M, 6.12, 1.2, C.muted);
  const stack = ["TypeScript · Node 22", "Express + multer", "React + Vite", "@cline/sdk", "Gemini 3.1 Flash-Lite", "zod", "vitest · 42 tests", "Render free tier"];
  let x = M + 0.85;
  stack.forEach((t) => (x += chip(pptx, s, t, x, 6.08, { size: 9.5, h: 0.32, pad: 0.26, bg: C.bg, color: C.ink }) + 0.08));
  if (x > W - M + 0.01) throw new Error(`Slide 6 stack chips overflow (${x.toFixed(2)} in)`);
  s.addNotes(
    "One Node process serves the API and the web app on Render's free tier. The vision model reads each screenshot into JSON that is validated with zod; bank SMS are parsed by plain code. After the worker confirms, the Cline SDK agent takes over. It has only five custom tools: run_checks calls our deterministic audit library, lookup_clause reads the bundled Act, and submit_docket ends the run, but only if every cited clause exists and the letter contains no verdict words. If there is no model, an error, or the run passes 120 seconds, a template fallback uses the same checks and guard, so the worker always gets a docket.",
  );
}
