// Slide 11: limitations, future scope, try it (QR).
import { C, F, M, W, LIVE, REPO, frame } from "./lib.mjs";
import { bullets, label } from "./parts.mjs";

export default function (pptx, qrPath) {
  const s = frame(pptx, "Limits · Future · Try it", "Karnataka today. Every state with a gig-worker law next.");
  const c1 = M;
  const c2 = 4.55;
  const c3 = 9.2;
  label(s, "Limitations", c1, 1.75, 3.6, C.muted);
  const lim = [
    "One state's law so far: Karnataka",
    "Accuracy depends on screenshot quality",
    "Can't see platform-side data: incentive rules, welfare-fee deposits",
    "Not legal advice; the Act's validity is pending in the High Court",
  ];
  bullets(s, lim, { x: c1, y: 2.15, w: 3.6, h: 3.4, size: 12, gap: 12 });
  label(s, "Future scope", c2, 1.75, 4.2);
  const fut = [
    ["More states", "Rajasthan, Telangana, Bihar, and the central Code on Social Security"],
    ["Less typing", "Voice input in Kannada and Hindi; screen-recording and bank-statement import"],
    ["Android companion", "Reads bank SMS directly (Play Store money-management exception)"],
    ["Union dashboard", "Anonymised, aggregated findings across workers"],
    ["Platform data", "DPDP access requests from May 2027; direct IPGRS filing if an API opens"],
  ];
  fut.forEach(([t, b], i) => {
    s.addText(
      [
        { text: `${t}  `, options: { fontFace: F.head, color: C.ink } },
        { text: b, options: { color: C.muted } },
      ],
      { x: c2, y: 2.15 + i * 0.66, w: 4.3, h: 0.6, fontFace: F.body, fontSize: 11.5, valign: "top", margin: 0 },
    );
  });
  const qw = W - M - c3;
  s.addShape(pptx.ShapeType.roundRect, { x: c3, y: 1.75, w: qw, h: 4.3, rectRadius: 0.12, fill: { color: C.brandBg }, line: { color: C.brandLine, width: 1 } });
  s.addText("Try it on your phone", { x: c3, y: 1.95, w: qw, h: 0.4, fontFace: F.head, fontSize: 15, color: C.brand, align: "center", margin: 0 });
  const q = 2.3;
  s.addShape(pptx.ShapeType.roundRect, { x: c3 + (qw - q - 0.2) / 2, y: 2.45, w: q + 0.2, h: q + 0.2, rectRadius: 0.08, fill: { color: C.white }, line: { color: C.white, width: 0 } });
  s.addImage({ path: qrPath, x: c3 + (qw - q) / 2, y: 2.55, w: q, h: q, altText: `QR code: ${LIVE}`, hyperlink: { url: LIVE } });
  s.addText(
    [
      { text: "Tap \"Try with demo data\"", options: { fontFace: F.head, fontSize: 11.5, color: C.ink, breakLine: true } },
      { text: LIVE.replace("https://", ""), options: { fontSize: 10.5, color: C.brand, hyperlink: { url: LIVE }, breakLine: true } },
      { text: REPO.replace("https://github.com/", "github.com/"), options: { fontSize: 10.5, color: C.brand, hyperlink: { url: REPO }, breakLine: true } },
      { text: "First load may take a minute (free server wakes up)", options: { fontSize: 9, color: C.muted } },
    ],
    { x: c3 + 0.15, y: 5.0, w: qw - 0.3, h: 1.45, fontFace: F.body, align: "center", valign: "top", margin: 0, paraSpaceAfter: 3 },
  );
  s.addNotes(
    "Our limits: today it covers one state's law, Karnataka's. Accuracy depends on screenshot quality, and we cannot see platform-side data. It is not legal advice, and the Act is still before the High Court. Our goal is every gig worker in India. The checks are plain code and the law is a data file, so the next step is Rajasthan, Telangana, Bihar and the central Code on Social Security, each mostly a new law file and a new language. After that: voice input, an Android companion that reads bank SMS directly, and a union dashboard of anonymised findings. Please scan the code and try it on your phone: tap 'Try with demo data'. Thank you.",
  );
}
