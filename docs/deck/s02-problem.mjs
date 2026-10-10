// Slide 2: the problem.
import { C, F, M, CW, frame } from "./lib.mjs";
import { label, stat } from "./parts.mjs";

export default function (pptx) {
  const s = frame(pptx, 2, "The problem", "Paid, penalised and blocked by systems they can't inspect");
  const cw = (CW - 0.6) / 3;
  const stats = [
    { value: "7.7M → 23.5M", caption: "gig workers in India, 2020-21 → projected 2029-30 (NITI Aayog)" },
    { value: "~7 lakh", caption: "active gig workers reported by platforms in Karnataka, April 2026" },
    { value: "83% · 87%", caption: "of cab drivers · delivery workers say ID blocking or deactivation hurt them (PAIGAM 2024)", color: C.issue },
  ];
  stats.forEach((st, i) => stat(s, { x: M + i * (cw + 0.3), y: 1.7, w: cw, size: 34, ...st }));
  s.addShape(pptx.ShapeType.line, { x: M, y: 3.6, w: CW, h: 0, line: { color: C.line, width: 0.75 } });
  label(s, "What a worker actually sees", M, 3.85, 6);
  const pains = [
    ["Adjustment   −₹180", "A deduction with no reason given"],
    ["App ₹6,105 · Bank ₹6,005", "Less money arrives than the app shows"],
    ["\"Your ID has been blocked\"", "No reason, effective the same day"],
  ];
  pains.forEach(([big, small], i) => {
    const x = M + i * (cw + 0.3);
    s.addShape(pptx.ShapeType.roundRect, { x, y: 4.25, w: cw, h: 1.25, rectRadius: 0.08, fill: { color: C.bg }, line: { color: C.line, width: 0.75 } });
    s.addText(
      [
        { text: big, options: { fontFace: F.mono, fontSize: 14, color: C.ink, breakLine: true } },
        { text: small, options: { fontFace: F.body, fontSize: 11.5, color: C.muted } },
      ],
      { x: x + 0.2, y: 4.25, w: cw - 0.4, h: 1.25, valign: "middle", margin: 0, paraSpaceAfter: 6 },
    );
  });
  s.addText(
    [
      { text: "The platform holds the data. ", options: { color: C.ink } },
      { text: "The worker holds a pile of screenshots.", options: { color: C.brand } },
    ],
    { x: M, y: 5.8, w: CW, h: 0.6, fontFace: F.head, fontSize: 22, margin: 0 },
  );
  s.addText("Sources: NITI Aayog (2022); The Hindu (2026); PAIGAM, Prisoners on Wheels? (2024). Links in the README.", {
    x: M, y: 6.45, w: CW, h: 0.3, fontFace: F.body, fontSize: 9, color: C.muted, margin: 0,
  });
  s.addNotes(
    "India has millions of gig workers, close to 7 lakh in Karnataka alone. They are paid, penalised and deactivated by apps they cannot inspect: a deduction just called 'Adjustment', a bank credit smaller than the app showed, an ID block with no reason. In PAIGAM's survey more than 80% said blocking hurt them. The platform has all the data; the worker has screenshots in the gallery and SMS in the inbox.",
  );
}
