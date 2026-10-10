// Slide 9: how Cline was used, in the build and inside the product.
import { C, F, M, CW, frame, shot } from "./lib.mjs";
import { label } from "./parts.mjs";

export default function (pptx) {
  const s = frame(pptx, "How Cline was used", "Cline built it. The Cline SDK runs inside it.");
  const colW = (CW - 0.5) / 2;
  const L = M;
  const R = M + colW + 0.5;

  // Left: in the build
  label(s, "In the build", L, 1.75, colW);
  shot(pptx, s, {
    x: L, y: 2.1, w: colW, h: 2.35, file: "cline-build.png",
    label: "Cline in the build", hint: "A3 clip frame: Cline panel with the failing SMS test → the fix in sms.ts → tests green",
  });
  const build = [
    ["Test-first", "Failing vitest test first, then Cline writes the check until it passes"],
    ["Built with Cline", "Scaffold, zod schemas, citation guard, React screens, e2e test"],
    ["42 tests", "checks, SMS parser, guards, agent loop with a stub model, API"],
  ];
  build.forEach(([t, b], i) => {
    s.addText(
      [
        { text: `${t}   `, options: { fontFace: F.head, color: C.ink } },
        { text: b, options: { color: C.muted } },
      ],
      { x: L, y: 4.6 + i * 0.5, w: colW, h: 0.46, fontFace: F.body, fontSize: 11.5, valign: "middle", margin: 0 },
    );
  });

  // Right: inside the product
  label(s, "Inside the product  ·  bonus criterion", R, 1.75, colW);
  const code = [
    "const agent = createAgent(source, {",
    "  systemPrompt: systemPrompt(ledger),",
    "  tools: [getLedgerSummary, runChecks,",
    "          lookup, ask, submit],",
    "  maxIterations: 12,",
    "});",
    "",
    "createTool({ name: \"submit_docket\",",
    "  lifecycle: { completesRun: true }, ... })",
  ].join("\n");
  s.addText(code, {
    shape: pptx.ShapeType.roundRect, x: R, y: 2.1, w: colW, h: 2.35, rectRadius: 0.08,
    fill: { color: "0F1720" }, line: { color: "0F1720", width: 0 },
    fontFace: F.mono, fontSize: 11, color: "E6EDF3", valign: "middle", margin: 14,
  });
  s.addText("server/agent.ts", { x: R, y: 4.47, w: colW, h: 0.22, fontFace: F.mono, fontSize: 9, color: C.muted, margin: 0, align: "right" });
  const inside = [
    ["Agent + createTool", "5 zod-typed custom tools, no built-in shell, file or web tools"],
    ["ask_worker", "Pauses the run and asks the worker a question over SSE"],
    ["completesRun", "submit_docket ends the run, only after the guards pass"],
  ];
  inside.forEach(([t, b], i) => {
    s.addText(
      [
        { text: `${t}   `, options: { fontFace: F.head, color: C.brand } },
        { text: b, options: { color: C.muted } },
      ],
      { x: R, y: 4.75 + i * 0.5, w: colW, h: 0.46, fontFace: F.body, fontSize: 11.5, valign: "middle", margin: 0 },
    );
  });
  s.addNotes(
    "Cline was used in two ways. In the build, Cline was our coding partner from the first commit: we wrote a failing test, and Cline wrote the code until it passed. The clip in our video shows Cline adding new bank SMS formats exactly this way. Inside the product, the Cline SDK Agent runs every audit. We give it only our five custom tools, typed with zod. ask_worker can pause the run to ask the worker a question, and submit_docket uses completesRun, so the run ends only when a docket passes our citation and verdict guards.",
  );
}
