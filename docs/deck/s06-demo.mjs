// Slide 6: demo, Ravi's week. Three phone screenshot slots + the findings.
import { C, F, M, W, frame, shot } from "./lib.mjs";
import { chip, label } from "./parts.mjs";

export default function (pptx) {
  const s = frame(pptx, "Demo · Ravi's week", "One week of evidence, audited in about 30 seconds");
  const pw = 2.2;
  const ph = pw * (1307 / 738); // phone screenshots cropped to the app area (738×1307)
  const y = 1.95;
  const phones = [
    ["shot-collect.png", "1  Collect", "Collect screen: upload, SMS box, \"Try with demo data\""],
    ["shot-confirm.png", "2  Confirm", "Confirm screen: thumbnails + editable numbers + bank credits"],
    ["shot-result.png", "3  Docket", "Result screen: finding cards with arithmetic"],
  ];
  phones.forEach(([file, cap, hint], i) => {
    const x = M + i * (pw + 0.25);
    shot(pptx, s, { x, y, w: pw, h: ph, file, label: cap.slice(3), hint });
    s.addText(cap, { x, y: y + ph + 0.1, w: pw, h: 0.3, fontFace: F.head, fontSize: 11, color: C.muted, margin: 0, align: "center" });
  });

  const fx = M + 3 * (pw + 0.25) + 0.25;
  const fw = W - M - fx;
  label(s, "What it found  (synthetic data)", fx, 1.75, fw);
  const rows = [
    ["C1", "₹275", "of deductions with only a vague label"],
    ["C2", "₹120", "gap: ₹6,650 − ₹425 ≠ ₹6,105 shown"],
    ["C3", "0 days", "notice and no reason for an ID block"],
    ["C7", "₹100", "less reached the bank than the app showed"],
    ["C5", "₹90/h", "real earnings after fuel, against ₹128/h gross"],
  ];
  rows.forEach(([id, big, text], i) => {
    const ry = 2.15 + i * 0.66;
    const issue = id !== "C5";
    chip(pptx, s, id, fx, ry + 0.12, { w: 0.5, h: 0.3, size: 9.5, mono: true, bg: issue ? C.issueBg : C.info, color: issue ? C.issue : C.muted });
    s.addText(
      [
        { text: `${big}  `, options: { fontFace: F.head, fontSize: 16, color: issue ? C.issue : C.ink } },
        { text, options: { fontFace: F.body, fontSize: 11.5, color: C.ink } },
      ],
      { x: fx + 0.65, y: ry, w: fw - 0.65, h: 0.58, valign: "middle", margin: 0 },
    );
  });
  s.addShape(pptx.ShapeType.line, { x: fx, y: 5.55, w: fw, h: 0, line: { color: C.line, width: 0.75 } });
  s.addText(
    [
      { text: "C4 OK", options: { fontFace: F.head, color: C.ok } },
      { text: "  weekly payouts.  OTP and fuel-debit SMS skipped automatically.", options: { color: C.muted, breakLine: true } },
      { text: "Output: ", options: { fontFace: F.head, color: C.ink } },
      { text: "5 possible issues, grievance letter, s.13 request, PDF docket.", options: { color: C.muted } },
    ],
    { x: fx, y: 5.65, w: fw, h: 0.9, fontFace: F.body, fontSize: 11, margin: 0, valign: "top", paraSpaceAfter: 4 },
  );
  s.addNotes(
    "Meet Ravi, a synthetic two-wheeler delivery partner in Bengaluru. He uploads three screenshots, two overlapping weekly statements and an ID-block notice, and pastes five SMS. On the Confirm screen he fixes one misread number. About 30 seconds later the docket shows five possible issues: ₹275 of deductions with only vague labels, a ₹120 arithmetic gap, a block with zero days' notice and no reason, ₹100 less in the bank than the app showed, and his real hourly earnings after fuel: ₹90, not ₹128. All numbers come from code, not from the AI.",
  );
}
