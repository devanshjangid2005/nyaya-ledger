# B2 phone QA

## 1. Emulated phone run (10 Oct 2026)

Headless Chrome emulating an Android phone: 360×800 CSS px at 3× density, touch on. Full demo flow (demo data → Confirm → docket → PDF) in ಕನ್ನಡ, हिन्दी and English, against a local build without AI (template docket). For each screen the script checks horizontal overflow, clipped text, tap targets under 40 px and English left in the Kannada/Hindi UI. Screenshots are saved as tiles of at most 1080×1800 px, because one full-page capture of the result page is about 12,900 px tall, over the 8000 px image limit of AI tools.

### Found and fixed (branch `b/ui-qa`)

| Issue | Where | Fix |
|---|---|---|
| English left in kn/hi UI: "N selected", "AI reading is off…", form errors | Collect | Translated (`i18n.ts`) |
| "Net payout", "+ pay / + bonus / − cut", "+ line", "Reason given…", date error | Confirm (`cards.tsx`, `Confirm.tsx`) | Translated |
| Skipped-SMS reasons ("OTP message", "not a credit", …) shown in English | Confirm | Mapped to kn/hi (`SKIP_REASON`); the server keeps English |
| Agent step names ("Running the checks", …) and "You:" in English | Audit | Per-language `STEP_LABEL` |
| "Evidence:", "Act:", "Evidence: bank SMS", "quoted sections" | Result | Translated; heading says the Act text is the original English |
| Footer "Not legal advice · …" in English on every screen | All | Translated |
| Line labels cut off in a narrow input ("Penalty - late delivery (order #…") | Confirm | Label is now a full-width wrapping field under the type and amount |
| Tap targets under 40 px: SMS checkboxes 20×13, "+ line" 40×35, Copy 30×35, skipped-SMS expander 21 px tall | Confirm, Result | Checkboxes 40×40; text buttons and the expander at least 44 px |

After the fixes, the same run reports **no overflow, no clipped text, no small tap targets and no English UI text** in any language. Every language still shows 5 possible issues and prints a PDF. `npm run typecheck`, `npm test` (42) and `npm run e2e` pass.

### Expected, not bugs

- Without AI, the summary, findings, letter and s.13 request are in English in every language: the template fallback is English-only by design (`server/fallback.ts`). With the live model they are written in the chosen language.
- Labels copied from the screenshots (e.g. "Order earnings") and the quoted Act text stay as printed.

### Needs a human

- **Wording.** The new Kannada and Hindi strings have not been checked by a native speaker yet.
- **Hindi font.** The emulated run reports only "Noto Sans" for Hindi text. Check on a real phone that Devanagari letters join correctly on screen and in the PDF.

## 2. Real Android phone on the live app

To do on https://nyaya-ledger.onrender.com once this branch is merged and deployed (open it 2 minutes early; the free server sleeps):

- [ ] ಕನ್ನಡ: demo data → Confirm → docket (agent, not template) → Save as PDF
- [ ] हिन्दी: same
- [ ] English: same
- [ ] Upload the 3 demo screenshots instead of demo data; Confirm fills correctly
- [ ] PDF from the phone opens with joined Kannada and Devanagari letters
- [ ] Native speaker read-through of the kn/hi UI and the agent's letter
- [ ] Phone model, Android and Chrome version noted here
