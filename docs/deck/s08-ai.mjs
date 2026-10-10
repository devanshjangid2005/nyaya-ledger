// Slide 8: AI models and tools.
import { C, F, M, CW, frame } from "./lib.mjs";
import { label } from "./parts.mjs";

export default function (pptx) {
  const s = frame(pptx, "AI models and tools", "AI where language is hard. Code where numbers must be right.");
  const colW = (CW - 0.5) / 2;
  const L = M;
  const R = M + colW + 0.5;

  label(s, "AI does", L, 1.75, colW);
  s.addShape(pptx.ShapeType.line, { x: L, y: 2.07, w: colW, h: 0, line: { color: C.brand, width: 2 } });
  const ai = [
    ["Read screenshots", "Gemini 3.1 Flash-Lite (vision) → strict JSON, validated with zod, 1 retry. Every value keeps its source image ID"],
    ["Run the audit", "Cline SDK Agent on the same model: decides which checks apply, asks the worker for missing inputs"],
    ["Explain and draft", "Plain-language summary, grievance letter and s.13 request in Kannada, Hindi or English"],
  ];
  ai.forEach(([t, b], i) => {
    s.addText(
      [
        { text: t, options: { fontFace: F.head, fontSize: 14, color: C.brand, breakLine: true } },
        { text: b, options: { fontFace: F.body, fontSize: 11.5, color: C.muted } },
      ],
      { x: L, y: 2.25 + i * 1.02, w: colW, h: 0.95, valign: "top", margin: 0, paraSpaceAfter: 3 },
    );
  });

  label(s, "Code does (no AI)", R, 1.75, colW, C.ink);
  s.addShape(pptx.ShapeType.line, { x: R, y: 2.07, w: colW, h: 0, line: { color: C.ink, width: 2 } });
  const code = [
    ["Parse bank SMS", "Regex parser for SBI, HDFC and Axis-style credits. SMS never reach a model"],
    ["Every number", "Checks C1-C5 and C7 are pure TypeScript functions with vitest tests"],
    ["Every citation", "Clause text comes from a bundled copy of the Act, never from the model"],
  ];
  code.forEach(([t, b], i) => {
    s.addText(
      [
        { text: t, options: { fontFace: F.head, fontSize: 14, color: C.ink, breakLine: true } },
        { text: b, options: { fontFace: F.body, fontSize: 11.5, color: C.muted } },
      ],
      { x: R, y: 2.25 + i * 1.02, w: colW, h: 0.95, valign: "top", margin: 0, paraSpaceAfter: 3 },
    );
  });

  label(s, "The agent's only 5 tools", M, 5.4, 6, C.muted);
  const tools = [
    ["get_ledger_summary", "what's in the ledger"],
    ["run_checks", "deterministic checks"],
    ["lookup_clause", "verbatim Act text"],
    ["ask_worker", "one question, live"],
    ["submit_docket", "guarded, ends the run"],
  ];
  const tw = (CW - 0.4) / 5;
  tools.forEach(([name, what], i) => {
    s.addText(
      [
        { text: name, options: { fontFace: F.mono, fontSize: 11, color: C.brand, breakLine: true } },
        { text: what, options: { fontFace: F.body, fontSize: 10, color: C.muted } },
      ],
      {
        shape: pptx.ShapeType.roundRect, x: M + i * (tw + 0.1), y: 5.75, w: tw, h: 0.82, rectRadius: 0.08,
        fill: { color: C.white }, line: { color: C.brandLine, width: 1 }, align: "center", valign: "middle", margin: 4, paraSpaceAfter: 2,
      },
    );
  });
  s.addNotes(
    "We split the work carefully. AI does what is hard for code: reading messy screenshots, deciding what to check, and writing in Kannada or Hindi. Code does everything that must be exactly right: parsing SMS, every number in every finding, and every quoted clause. The agent runs on Gemini 3.1 Flash-Lite through the Cline SDK's built-in provider, and any other provider works by changing an environment variable. It has exactly five typed tools. The rule we built around: the agent decides what to do and how to explain it, never what the numbers are.",
  );
}
