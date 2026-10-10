// Small drawing helpers: chips, boxes, arrows, bullet lists, labels.
import { C, F, NO_LINE } from "./lib.mjs";

/** Rough text width in inches, for sizing chips. */
export const est = (text, size, mono = false, pad = 0.38) => text.length * size * (mono ? 0.0085 : 0.0074) + pad;

/** Pill-shaped label. Returns its width. */
export function chip(pptx, s, text, x, y, o = {}) {
  const size = o.size ?? 11;
  const h = o.h ?? 0.36;
  const w = o.w ?? est(text, size, o.mono, o.pad);
  s.addText(text, {
    shape: pptx.ShapeType.roundRect, x, y, w, h, rectRadius: h / 2,
    fill: { color: o.bg ?? C.brandBg }, line: o.line ? { color: o.line, width: 0.75 } : NO_LINE,
    fontFace: o.mono ? F.mono : (o.font ?? F.body), fontSize: size, color: o.color ?? C.brand,
    align: "center", valign: "middle", margin: 0,
  });
  return w;
}

const TONE = {
  ai: { bg: C.brandBg, line: C.brandLine, title: C.brand },
  code: { bg: C.bg, line: C.line, title: C.ink },
  worker: { bg: C.okBg, line: C.okLine, title: C.ok },
  plain: { bg: C.white, line: C.line, title: C.ink },
  issue: { bg: C.issueBg, line: "F4C7C3", title: C.issue },
};

/** Rounded box with a title and body text. tone: ai | code | worker | plain | issue */
export function box(pptx, s, { x, y, w, h, title, body, tone = "code", titleSize = 13, bodySize = 10.5, align = "left", valign = "top" }) {
  const t = TONE[tone];
  s.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: t.bg }, line: { color: t.line, width: 1 } });
  const runs = [{ text: title, options: { fontFace: F.head, fontSize: titleSize, color: t.title, breakLine: !!body } }];
  if (body) runs.push({ text: body, options: { fontFace: F.body, fontSize: bodySize, color: C.muted } });
  s.addText(runs, { x: x + 0.14, y: y + 0.1, w: w - 0.28, h: h - 0.2, align, valign, margin: 0, paraSpaceAfter: 3 });
}

/** Straight arrow from (x1,y1) to (x2,y2). */
export function arrow(pptx, s, x1, y1, x2, y2, o = {}) {
  const flipH = x2 < x1;
  const flipV = y2 < y1;
  s.addShape(pptx.ShapeType.line, {
    x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1), flipH, flipV,
    line: { color: o.color ?? C.dash, width: o.width ?? 1.25, endArrowType: "triangle", dashType: o.dash ? "dash" : "solid" },
  });
}

/** Bullet list. items: "text" or ["Bold lead", "rest of the line"]. */
export function bullets(s, items, o) {
  const runs = items.flatMap((it, i) => {
    const [lead, rest] = Array.isArray(it) ? it : [null, it];
    const end = i < items.length - 1;
    const para = { bullet: o.bullet === false ? false : { indent: 14 }, paraSpaceAfter: o.gap ?? 8 };
    if (!lead) return [{ text: rest, options: { ...para, color: o.color ?? C.ink, breakLine: end } }];
    return [
      { text: `${lead}  `, options: { ...para, fontFace: F.head, color: C.ink } },
      { text: rest, options: { color: o.color ?? C.muted, breakLine: end } },
    ];
  });
  s.addText(runs, {
    x: o.x, y: o.y, w: o.w, h: o.h, fontFace: F.body, fontSize: o.size ?? 13, color: C.ink,
    valign: "top", margin: 0, lineSpacingMultiple: o.spacing ?? 1.05,
  });
}

/** Small uppercase section label. */
export function label(s, text, x, y, w, color = C.brand) {
  s.addText(text.toUpperCase(), { x, y, w, h: 0.28, fontFace: F.head, fontSize: 10.5, color, charSpacing: 2, margin: 0 });
}

/** Big number + caption (stat block). */
export function stat(s, { x, y, w, value, caption, color = C.ink, size = 40 }) {
  s.addText(value, { x, y, w, h: 0.8, fontFace: F.head, fontSize: size, color, margin: 0, valign: "bottom" });
  s.addText(caption, { x, y: y + 0.86, w, h: 0.7, fontFace: F.body, fontSize: 11.5, color: C.muted, margin: 0, valign: "top" });
}
