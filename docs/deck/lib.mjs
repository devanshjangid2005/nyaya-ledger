// Theme + helpers for the Nyaya-Ledger deck. Modern, minimal: white space, one accent colour.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const HERE = dirname(fileURLToPath(import.meta.url));
export const SHOTS = join(HERE, "shots");
export const LIVE = "https://nyaya-ledger.onrender.com";
export const REPO = "https://github.com/devanshjangid2005/nyaya-ledger";
export const TOTAL = 10;

// Colours from web/src/styles.css, so the deck matches the app.
export const C = {
  ink: "1B1F24",
  muted: "5B6470",
  line: "D9DEE4",
  bg: "F6F7F9",
  brand: "0B5CAD",
  brandBg: "EAF2FB",
  brandLine: "B9D3EE",
  issue: "B42318",
  issueBg: "FEF3F2",
  ok: "067647",
  okBg: "ECFDF3",
  okLine: "A6E3C1",
  info: "F2F4F7",
  dash: "9AA4B2",
  white: "FFFFFF",
};
export const F = { head: "Segoe UI Semibold", body: "Segoe UI", light: "Segoe UI Light", mono: "Consolas", indic: "Nirmala UI" };

export const W = 13.333;
export const H = 7.5;
export const M = 0.6; // side margin
export const CW = W - 2 * M; // content width
export const NO_LINE = { color: C.white, width: 0, transparency: 100 };

/** Placeholders that still have no screenshot, reported after the build. */
export const missing = [];

/** Standard content slide: kicker, title, footer. */
export function frame(pptx, n, kicker, title) {
  const s = pptx.addSlide();
  s.background = { color: C.white };
  s.addText(`${String(n).padStart(2, "0")}   ${kicker.toUpperCase()}`, {
    x: M, y: 0.42, w: CW, h: 0.3, fontFace: F.head, fontSize: 11, color: C.brand, charSpacing: 2, margin: 0,
  });
  s.addText(title, { x: M, y: 0.74, w: CW, h: 0.75, fontFace: F.head, fontSize: 28, color: C.ink, margin: 0, valign: "top" });
  s.addShape(pptx.ShapeType.rect, { x: M, y: 7.04, w: 0.09, h: 0.09, fill: { color: C.brand }, line: NO_LINE });
  s.addText("Nyaya-Ledger  ·  Cline AI Builder Hackathon", {
    x: M + 0.2, y: 6.96, w: 6, h: 0.25, fontFace: F.body, fontSize: 9, color: C.muted, margin: 0,
  });
  s.addText(`${n} / ${TOTAL}`, { x: W - M - 1.5, y: 6.96, w: 1.5, h: 0.25, fontFace: F.body, fontSize: 9, color: C.muted, align: "right", margin: 0 });
  return s;
}

/**
 * Screenshot slot. If docs/deck/shots/<file> (PNG) exists it is placed, cropped from the top to
 * fill the frame. Otherwise a dashed placeholder says exactly what to capture.
 */
export function shot(pptx, s, { x, y, w, h, file, label, hint }) {
  const p = join(SHOTS, file);
  if (existsSync(p)) {
    const buf = readFileSync(p);
    if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error(`${file} is not a PNG`);
    const iw = buf.readUInt32BE(16);
    const ih = buf.readUInt32BE(20); // PNG IHDR width/height
    const fullH = w * (ih / iw);
    if (fullH >= h) {
      s.addImage({ path: p, x, y, w, h: fullH, sizing: { type: "crop", x: 0, y: 0, w, h }, altText: label });
      s.addShape(pptx.ShapeType.rect, { x, y, w, h, fill: { color: C.white, transparency: 100 }, line: { color: C.line, width: 0.75 } });
    } else {
      const fw = Math.min(w, h * (iw / ih));
      const fh = fw * (ih / iw);
      const fx = x + (w - fw) / 2;
      s.addImage({ path: p, x: fx, y, w: fw, h: fh, altText: label });
      s.addShape(pptx.ShapeType.rect, { x: fx, y, w: fw, h: fh, fill: { color: C.white, transparency: 100 }, line: { color: C.line, width: 0.75 } });
    }
    return;
  }
  missing.push(file);
  s.addText(
    [
      { text: label, options: { fontFace: F.head, fontSize: 12, color: C.muted, breakLine: true } },
      { text: hint, options: { fontFace: F.body, fontSize: 10, color: C.muted, breakLine: true } },
      { text: `shots/${file}`, options: { fontFace: F.mono, fontSize: 9, color: C.dash } },
    ],
    {
      shape: pptx.ShapeType.roundRect, x, y, w, h, rectRadius: 0.12,
      fill: { color: C.info }, line: { color: C.dash, width: 1, dashType: "dash" },
      align: "center", valign: "middle", margin: 8, paraSpaceAfter: 4,
    },
  );
}
