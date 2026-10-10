// Slide 10: challenges and how we solved them.
import { C, F, M, CW, frame } from "./lib.mjs";

export default function (pptx) {
  const s = frame(pptx, "Challenges", "What could go wrong, and what we built for it");
  const rows = [
    ["Vision misreads a number", "The worker confirms every value before any check runs"],
    ["Bank SMS formats vary", "Test-first parser; unknown formats are skipped with a reason, credits can be added by hand"],
    ["Prompt injection in screenshots", "Agent has only 5 typed tools. Ledger text is treated as data, never as instructions"],
    ["Model invents a law or a verdict", "Citation guard + verdict-word guard (EN · ಕನ್ನಡ · हिन्दी) reject the docket; agent must rewrite"],
    ["Kannada PDF on a 512 MB free host", "No server Chromium: print stylesheet + Noto fonts, the phone's browser saves the PDF"],
    ["Free-tier quota and timeouts", "Template fallback after 120 s, same checks and guard, labelled \"generated without AI\""],
    ["The Act is challenged in court", "No position taken; every docket carries the pending-case note"],
  ];
  const cw1 = 4.1;
  s.addText("CHALLENGE", { x: M, y: 1.7, w: cw1, h: 0.28, fontFace: F.head, fontSize: 10, color: C.muted, charSpacing: 2, margin: 0 });
  s.addText("WHAT WE DID", { x: M + cw1 + 0.6, y: 1.7, w: 6, h: 0.28, fontFace: F.head, fontSize: 10, color: C.muted, charSpacing: 2, margin: 0 });
  const rh = 0.6;
  rows.forEach(([c, fix], i) => {
    const y = 2.05 + i * rh;
    s.addShape(pptx.ShapeType.line, { x: M, y, w: CW, h: 0, line: { color: C.line, width: 0.75 } });
    s.addText(c, { x: M, y, w: cw1, h: rh, fontFace: F.head, fontSize: 13, color: C.ink, valign: "middle", margin: 0 });
    s.addText("→", { x: M + cw1, y, w: 0.6, h: rh, fontFace: F.body, fontSize: 14, color: C.brand, valign: "middle", align: "center", margin: 0 });
    s.addText(fix, { x: M + cw1 + 0.6, y, w: CW - cw1 - 0.6, h: rh, fontFace: F.body, fontSize: 12, color: C.muted, valign: "middle", margin: 0 });
  });
  s.addShape(pptx.ShapeType.line, { x: M, y: 2.05 + rows.length * rh, w: CW, h: 0, line: { color: C.line, width: 0.75 } });
  // Kannada in its own non-italic Nirmala run: Segoe UI has no Kannada, and synthetic italic breaks the shaping.
  s.addText(
    [
      { text: "Real example: ", options: { fontFace: F.head, color: C.ink } },
      { text: "in testing, Gemini wrote " },
      { text: "ಉಲ್ಲಂಘನೆ", options: { fontFace: F.indic, color: C.issue } },
      { text: " (violation) in a Kannada letter. The verdict guard caught it and the agent rewrote it." },
    ],
    { x: M, y: 6.38, w: CW, h: 0.34, fontFace: F.body, fontSize: 11, color: C.muted, margin: 0, valign: "middle" },
  );
  s.addNotes(
    "Every one of these happened or nearly happened during the build. Vision models misread numbers, so the worker confirms them. Bank SMS formats vary, so the parser is test-first and skips what it can't read. Screenshot text could contain instructions, so the agent has no general tools. Models invent things, so citations and verdict words are checked in code. In testing Gemini wrote the Kannada word for 'violation', and the guard sent it back. Kannada PDFs needed proper shaping, so the phone's browser makes the PDF. And because free quotas run out, there is always a template fallback.",
  );
}
