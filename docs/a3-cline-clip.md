# A3: "Cline in the build" clip (60-90 s)

Goal: show Cline doing **test-first** work on a real bug, live, in VS Code.

## The bug (checked 10 Oct 2026; leave it unfixed until you record)

The SMS parser (`server/sms.ts`) gets these real bank formats wrong:

| SMS | What happens now | Why it matters |
|---|---|---|
| `IMPS: Rs 2450.00 debited from A/c of ZIPRIDE TECH and credited to your A/c XX77 on 08-10-26. Ref 612398712345` | **Skipped as "not a credit"** | The word "debited" refers to the *payer's* account. The worker loses a real platform payout, so C7 (bank vs app) would be wrong |
| `Rs.2,450.00 credited to A/c XX77 on 2026/10/08 by NEFT from ZIPRIDE TECH` | Skipped: "no date found" | Year-first date with `/` |
| `Your A/c XX77 is credited with 2,450.00 INR on 08-10-2026 by ZIPRIDE TECH` | Skipped: "no amount found" | Amount written before "INR" |

(The Kotak "Credit Alert!" SMS in the original plan already works, so it's no good for a failing-test demo.)

## Recording steps

1. Open `D:\Cline\nyaya-ledger` in VS Code. Put the Cline panel on the right and `server/sms.test.ts` on the left. Start screen recording (Win+Alt+R, or OBS).
2. Paste this prompt into Cline:

   > In server/sms.test.ts add one failing test, "handles payer-side wording and other layouts", for these 3 bank SMS. Each must give one credit of 2450 on 2026-10-08 with fromPlatform true (platformHints ["zipride"], year 2026):
   > 1. "IMPS: Rs 2450.00 debited from A/c of ZIPRIDE TECH and credited to your A/c XX77 on 08-10-26. Ref 612398712345"
   > 2. "Rs.2,450.00 credited to A/c XX77 on 2026/10/08 by NEFT from ZIPRIDE TECH"
   > 3. "Your A/c XX77 is credited with 2,450.00 INR on 08-10-2026 by ZIPRIDE TECH"
   > Run `npx vitest run server/sms.test.ts` and show it failing. Then fix server/sms.ts so it passes without breaking the other tests. A message where *your* account is debited must still be skipped.

3. Let Cline run. Make sure the recording shows:
   - the new test **failing** (red),
   - Cline's diff to `server/sms.ts`,
   - the test run **passing** (green).
4. Run `npm test` yourself; all tests should pass. Stop recording. Cut it to 60-90 s and save it as `docs/cline/a3-clip.mp4`. **Don't commit the video** if it's over about 50 MB; share it with your teammate instead.
5. Take 2-3 screenshots (prompt, diff, green tests) and save them in `docs/cline/` for the README "How Cline was used" section (A5).
6. Commit on branch `a/cline-clip`, then open a PR. Render redeploys after the merge.
