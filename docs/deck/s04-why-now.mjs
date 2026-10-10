// Slide 4: why now (the Act + IPGRS).
import { C, F, M, W, NO_LINE, frame } from "./lib.mjs";
import { chip, label } from "./parts.mjs";

export default function (pptx) {
  const s = frame(pptx, "Why Karnataka first", "The rights and the filing channel exist. The evidence doesn't.");
  label(s, "Karnataka Platform Based Gig Workers Act, 2025", M, 1.75, 7);
  const rows = [
    ["s.15(1)", "Reasons for every deduction, stated in the invoice; pay as per contract"],
    ["s.15(2)", "Pay at least weekly, with no delay"],
    ["s.14(2)", "No deactivation without written reasons and 14 days' notice"],
    ["s.13(1)", "Right to ask how automated systems affect earnings"],
    ["s.22(2)", "Grievance on payouts, deductions or termination to the platform's IDRC"],
  ];
  rows.forEach(([sec, text], i) => {
    const y = 2.15 + i * 0.68;
    chip(pptx, s, sec, M, y + 0.07, { w: 1.05, mono: true, size: 11 });
    s.addText(text, { x: M + 1.25, y, w: 6.4, h: 0.5, fontFace: F.body, fontSize: 13, color: C.ink, valign: "middle", margin: 0 });
  });

  const tx = 8.75;
  const tw = W - M - tx;
  label(s, "Timeline", tx, 1.75, 4);
  const tl = [
    ["30 May 2025", "Act in force"],
    ["1 May 2026", "Grievances filed via IPGRS, routed to the IDRC"],
    ["3 Jul 2026", "High Court declines to stay the Act; case pending"],
  ];
  s.addShape(pptx.ShapeType.line, { x: tx + 0.09, y: 2.3, w: 0, h: 1.75, line: { color: C.brandLine, width: 1.5 } });
  tl.forEach(([d, t], i) => {
    const y = 2.15 + i * 0.85;
    s.addShape(pptx.ShapeType.ellipse, { x: tx, y: y + 0.06, w: 0.18, h: 0.18, fill: { color: C.brand }, line: NO_LINE });
    s.addText(
      [
        { text: d, options: { fontFace: F.head, fontSize: 12, color: C.ink, breakLine: true } },
        { text: t, options: { fontFace: F.body, fontSize: 11, color: C.muted } },
      ],
      { x: tx + 0.35, y, w: tw - 0.35, h: 0.78, valign: "top", margin: 0 },
    );
  });
  s.addText(
    [
      { text: "Missing: the evidence", options: { fontFace: F.head, fontSize: 14, color: C.issue, breakLine: true } },
      { text: "It sits in the worker's gallery and SMS inbox, and nobody reconciles it by hand.", options: { fontFace: F.body, fontSize: 11.5, color: C.ink } },
    ],
    {
      shape: pptx.ShapeType.roundRect, x: tx, y: 4.85, w: tw, h: 1.35, rectRadius: 0.08,
      fill: { color: C.issueBg }, line: { color: "F4C7C3", width: 1 }, margin: 12, valign: "middle", paraSpaceAfter: 4,
    },
  );
  s.addNotes(
    "Karnataka now has a law that speaks to exactly these problems: reasons for every deduction, weekly pay, 14 days' written notice before deactivation, and a right to ask how the algorithm works. Since May 2026 workers can file grievances through the state's IPGRS portal, which makes Karnataka the best place to prove the idea. Other states are moving the same way: Rajasthan, Telangana and Bihar have gig-worker laws, and the central Code on Social Security covers gig workers. In every state, what is missing is the evidence in a form a committee can act on. That is the gap we fill.",
  );
}
