// Slide 1: title.
import { C, F, NO_LINE, LIVE, REPO, shot } from "./lib.mjs";
import { chip } from "./parts.mjs";

export default function (pptx) {
  const s = pptx.addSlide();
  s.background = { color: C.white };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.14, h: 7.5, fill: { color: C.brand }, line: NO_LINE });
  s.addText("CLINE AI BUILDER HACKATHON  ·  ROUND 2", { x: 0.9, y: 1.05, w: 7.5, h: 0.3, fontFace: F.head, fontSize: 11, color: C.brand, charSpacing: 2, margin: 0 });
  s.addText("Nyaya-Ledger", { x: 0.9, y: 1.4, w: 7.6, h: 1.1, fontFace: F.head, fontSize: 56, color: C.ink, margin: 0 });
  s.addText(
    [
      { text: "Nyaya (" },
      { text: "न्याय", options: { fontFace: F.indic } },
      { text: " / " },
      { text: "ನ್ಯಾಯ", options: { fontFace: F.indic } },
      { text: ") means justice." },
    ],
    { x: 0.9, y: 2.5, w: 7.5, h: 0.35, fontFace: F.body, fontSize: 14, color: C.muted, margin: 0 },
  );
  s.addText("Turns the payout screenshots and bank SMS a gig worker already keeps into a checked, law-grounded grievance docket.", {
    x: 0.9, y: 3.1, w: 7.4, h: 1.25, fontFace: F.light, fontSize: 22, color: C.ink, margin: 0, valign: "top", lineSpacingMultiple: 1.05,
  });
  let x = 0.9;
  x += chip(pptx, s, "Cline SDK agent inside", x, 4.6, { bg: C.brand, color: C.white, font: F.head }) + 0.12;
  x += chip(pptx, s, "Karnataka Gig Workers Act, 2025", x, 4.6) + 0.12;
  chip(pptx, s, "Kannada · Hindi · English", x, 4.6);
  s.addShape(pptx.ShapeType.line, { x: 0.9, y: 5.45, w: 7.4, h: 0, line: { color: C.line, width: 0.75 } });
  s.addText(
    [
      { text: "Devansh Jangid  ·  Debasis Patnaik", options: { fontFace: F.head, fontSize: 13, color: C.ink, breakLine: true } },
      { text: "Live  ", options: { fontSize: 11.5, color: C.muted } },
      { text: LIVE.replace("https://", ""), options: { fontSize: 11.5, color: C.brand, hyperlink: { url: LIVE }, breakLine: true } },
      { text: "Code  ", options: { fontSize: 11.5, color: C.muted } },
      { text: REPO.replace("https://", ""), options: { fontSize: 11.5, color: C.brand, hyperlink: { url: REPO } } },
    ],
    { x: 0.9, y: 5.6, w: 7.4, h: 1.1, fontFace: F.body, margin: 0, valign: "top", paraSpaceAfter: 4 },
  );
  shot(pptx, s, {
    x: 9.15, y: 0.7, w: 3.15, h: 6.1, file: "hero-result.png",
    label: "Hero screenshot", hint: "Result screen in English: summary + first finding cards (phone, 412 px wide)",
  });
  s.addNotes(
    "Hi, we're Devansh and Debasis. Nyaya-Ledger helps platform gig workers in Karnataka turn what they already have, payout screenshots and bank SMS, into an evidence docket they can file under the state's new gig-worker law. It is live, so you can open it on your phone right now. Cline was our coding partner for the whole build, and the Cline SDK runs inside the product as the agent that does the audit.",
  );
}
