// Slide 3: voice from the ground. Interview with a delivery partner, taken during the hackathon.
// Add more pairs to QA; row heights adapt (up to about 4 pairs fit).
import { C, F, M, W, frame } from "./lib.mjs";
import { chip, label } from "./parts.mjs";

const PERSON = { name: "Prabal Sharma", role: "Delivery partner, Blinkit", note: "Interviewed by our team during the hackathon" };

// q / a: his words as spoken (Hinglish). qEn / aEn: our English translation.
const QA = [
  {
    q: "Aap delivery payments ya platform ke related kuch problems face karte hai kya?",
    qEn: "Do you face any problems with delivery payments or the platform?",
    a: "Han, kaafi dikkatein horhi hai recently, abhi kuch din pehle protest bhi hua tha iski wajah se.",
    aEn: "Yes, there have been a lot of problems recently. A few days ago there was even a protest because of it.",
  },
];

export default function (pptx) {
  const s = frame(pptx, "Voice from the ground", "We asked a delivery partner");
  const lx = M;
  const lw = 8.1;
  const top = 1.8;
  const bottom = 6.6;
  const rowH = Math.min(2.3, (bottom - top) / QA.length);
  if (rowH < 1.15) throw new Error(`Slide 3: too many Q&A pairs (${QA.length}) for one slide`);

  QA.forEach((p, i) => {
    const y = top + i * rowH;
    chip(pptx, s, "Q", lx, y + 0.02, { w: 0.36, h: 0.36, size: 11, font: F.head, bg: C.info, color: C.muted });
    s.addText(
      [
        { text: p.q, options: { fontFace: F.head, fontSize: 13, color: C.ink, breakLine: true } },
        { text: p.qEn, options: { fontFace: F.body, fontSize: 10.5, color: C.muted } },
      ],
      { x: lx + 0.55, y, w: lw - 0.55, h: rowH * 0.36, valign: "top", margin: 0, paraSpaceAfter: 2 },
    );
    const ay = y + rowH * 0.4;
    chip(pptx, s, "A", lx, ay + 0.02, { w: 0.36, h: 0.36, size: 11, font: F.head, bg: C.brand, color: C.white });
    s.addText(
      [
        { text: `"${p.a}"`, options: { fontFace: F.light, fontSize: QA.length > 1 ? 16 : 20, color: C.brand, breakLine: true } },
        { text: p.aEn, options: { fontFace: F.body, fontSize: 11, color: C.muted } },
      ],
      { x: lx + 0.55, y: ay, w: lw - 0.55, h: rowH * 0.58, valign: "top", margin: 0, paraSpaceAfter: 4, lineSpacingMultiple: 1.05 },
    );
  });

  // Attribution card
  const cx = 9.5;
  const cw = W - M - cx;
  s.addShape(pptx.ShapeType.roundRect, { x: cx, y: top, w: cw, h: 3.0, rectRadius: 0.12, fill: { color: C.brandBg }, line: { color: C.brandLine, width: 1 } });
  s.addText("\u201C", { x: cx + 0.25, y: top + 0.05, w: 1, h: 0.9, fontFace: "Georgia", fontSize: 60, color: C.brand, margin: 0, valign: "top" });
  s.addText(
    [
      { text: PERSON.name, options: { fontFace: F.head, fontSize: 18, color: C.ink, breakLine: true } },
      { text: PERSON.role, options: { fontFace: F.body, fontSize: 12.5, color: C.brand, breakLine: true } },
      { text: PERSON.note, options: { fontFace: F.body, fontSize: 10.5, color: C.muted } },
    ],
    { x: cx + 0.3, y: top + 1.05, w: cw - 0.6, h: 1.8, valign: "top", margin: 0, paraSpaceAfter: 5 },
  );
  label(s, "Why it matters", cx, top + 3.3, cw, C.muted);
  s.addText("Workers already feel the problem. What they lack is evidence in a form a grievance committee can act on.", {
    x: cx, y: top + 3.65, w: cw, h: 1.1, fontFace: F.body, fontSize: 11.5, color: C.ink, valign: "top", margin: 0,
  });
  s.addNotes(
    `During the hackathon we spoke to ${PERSON.name}, a Blinkit delivery partner. We asked whether he faces problems with delivery payments or the platform. In his words: "Han, kaafi dikkatein horhi hai recently", meaning yes, there have been a lot of problems recently, and a few days earlier there had even been a protest about it. Workers already feel the problem. What they lack is evidence in a form a grievance committee can act on, and that is what Nyaya-Ledger produces.`,
  );
}
