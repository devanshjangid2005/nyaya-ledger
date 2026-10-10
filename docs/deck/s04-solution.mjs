// Slide 4: the solution (six-step flow).
import { C, F, M, CW, frame } from "./lib.mjs";
import { arrow, label } from "./parts.mjs";

export default function (pptx) {
  const s = frame(pptx, 4, "The solution", "From a pile of screenshots to a docket a committee can act on");
  s.addText("Upload payout screenshots, paste bank SMS, add hours and fuel cost. Nyaya-Ledger does the rest:", {
    x: M, y: 1.6, w: CW, h: 0.35, fontFace: F.body, fontSize: 13, color: C.muted, margin: 0,
  });
  const steps = [
    ["Read", "Vision model reads each screenshot. SMS parsed by plain code, no AI", "ai"],
    ["Confirm", "Worker checks and corrects every number", "worker"],
    ["Check", "Deterministic, unit-tested audit checks", "code"],
    ["Quote", "Exact clause text from a bundled copy of the Act", "code"],
    ["Draft", "Grievance letter + s.13 request in Kannada, Hindi or English", "ai"],
    ["Docket", "PDF evidence docket, ready for IPGRS", "worker"],
  ];
  const gap = 0.28;
  const bw = (CW - gap * 5) / 6;
  const tone = {
    ai: { bg: C.brandBg, line: C.brandLine, fg: C.brand },
    code: { bg: C.bg, line: C.line, fg: C.ink },
    worker: { bg: C.okBg, line: C.okLine, fg: C.ok },
  };
  steps.forEach(([title, body, t], i) => {
    const x = M + i * (bw + gap);
    const c = tone[t];
    s.addShape(pptx.ShapeType.roundRect, { x, y: 2.2, w: bw, h: 2.15, rectRadius: 0.1, fill: { color: c.bg }, line: { color: c.line, width: 1 } });
    s.addText(String(i + 1), { x: x + 0.18, y: 2.32, w: 0.6, h: 0.5, fontFace: F.light, fontSize: 26, color: c.fg, margin: 0 });
    s.addText(
      [
        { text: title, options: { fontFace: F.head, fontSize: 15, color: C.ink, breakLine: true } },
        { text: body, options: { fontFace: F.body, fontSize: 10.5, color: C.muted } },
      ],
      { x: x + 0.18, y: 2.9, w: bw - 0.32, h: 1.35, valign: "top", margin: 0, paraSpaceAfter: 4 },
    );
    if (i < 5) arrow(pptx, s, x + bw + 0.03, 3.27, x + bw + gap - 0.03, 3.27);
  });
  const lx = M;
  [["AI model", tone.ai], ["Plain code", tone.code], ["Worker", tone.worker]].forEach(([name, c], i) => {
    const x = lx + i * 1.7;
    s.addShape(pptx.ShapeType.roundRect, { x, y: 4.55, w: 0.22, h: 0.22, rectRadius: 0.04, fill: { color: c.bg }, line: { color: c.line, width: 1 } });
    s.addText(name, { x: x + 0.3, y: 4.5, w: 1.3, h: 0.32, fontFace: F.body, fontSize: 10.5, color: C.muted, margin: 0, valign: "middle" });
  });

  s.addShape(pptx.ShapeType.line, { x: M, y: 5.1, w: CW, h: 0, line: { color: C.line, width: 0.75 } });
  label(s, "What it does not claim", M, 5.3, 5, C.issue);
  const nots = [
    ["Not a verdict", "Findings say \"possible issue for review\", with the arithmetic shown"],
    ["Not legal advice", "Every docket says so, and notes the pending High Court case"],
    ["No platform login", "No partner API exists; scraping could get the worker blocked"],
  ];
  const nw = (CW - 0.6) / 3;
  nots.forEach(([t, b], i) => {
    s.addText(
      [
        { text: t, options: { fontFace: F.head, fontSize: 12.5, color: C.ink, breakLine: true } },
        { text: b, options: { fontFace: F.body, fontSize: 11, color: C.muted } },
      ],
      { x: M + i * (nw + 0.3), y: 5.65, w: nw, h: 1.0, valign: "top", margin: 0, paraSpaceAfter: 3 },
    );
  });
  s.addNotes(
    "The worker uploads screenshots, pastes bank SMS and adds two numbers. A vision model reads the screenshots; the SMS are parsed by plain code and never go to an AI. Then the key step: the worker sees every extracted number and confirms or fixes it, so a misread number never becomes an accusation. Deterministic checks run on the confirmed data, the exact clause text is quoted, and the agent drafts the letter in the worker's language. Output is a PDF docket for the IPGRS portal. Equally important is what we do not claim: no verdicts, not legal advice, and no logging into the platform.",
  );
}
