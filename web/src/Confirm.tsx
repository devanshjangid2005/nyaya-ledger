import { useState } from "react";
import type { BankCredit, Extracted, Ledger } from "./api";
import type { Collected } from "./Collect";
import type { Strings } from "./i18n";
import { CreditRow, NoticeCard, StatementCard, type Notice, type Statement } from "./cards";

/** Editable view of everything that was read. Only what the worker confirms reaches the checks. */
export function Confirm({ t, collected, onConfirm, onBack }: { t: Strings; collected: Collected; onConfirm: (l: Ledger) => void; onBack: () => void }) {
  const [statements, setStatements] = useState<Statement[]>(() => collected.extracted.flatMap((e) => (e.status === "ok" && e.type === "statement" ? [e.data] : [])));
  const [notices, setNotices] = useState<Notice[]>(() => collected.extracted.flatMap((e) => (e.status === "ok" && e.type === "block_notice" ? [e.data] : [])));
  const [credits, setCredits] = useState<BankCredit[]>(collected.sms.credits);
  const [error, setError] = useState("");
  const unreadable = collected.extracted.filter((e): e is Extract<Extracted, { status: "unreadable" }> => e.status === "unreadable");
  const at = <T,>(arr: T[], i: number, v: T) => arr.map((x, j) => (j === i ? v : x));

  const addManualStatement = (id: string) =>
    setStatements((s) => [...s, { periodStart: "", periodEnd: "", netPayoutShown: 0, sourceImage: id, lines: [{ kind: "deduction", label: "", amount: 0, sourceImage: id }] }]);

  function confirm() {
    const bad = [...statements.flatMap((s) => [s.periodStart, s.periodEnd]), ...notices.flatMap((n) => [n.noticeDate, n.effectiveDate]), ...credits.map((c) => c.date)].some(
      (d) => !/^\d{4}-\d{2}-\d{2}$/.test(d),
    );
    if (bad) return setError("Dates must look like 2026-10-06.");
    onConfirm({
      statements: statements.map((s) => ({ ...s, lines: s.lines.filter((l) => l.label.trim() !== "" || l.amount > 0) })),
      blockNotices: notices,
      bankCredits: credits,
      payoutDates: [],
      inputs: collected.inputs,
    });
  }

  return (
    <section>
      <h2>{t.confirmTitle}</h2>
      <p className="note">{t.confirmHint}</p>

      {statements.map((s, i) => (
        <StatementCard key={`s${i}`} t={t} s={s} thumb={collected.thumbs[s.sourceImage]} onChange={(v) => setStatements((a) => at(a, i, v))} />
      ))}
      {notices.map((n, i) => (
        <NoticeCard key={`n${i}`} t={t} n={n} thumb={collected.thumbs[n.sourceImage]} onChange={(v) => setNotices((a) => at(a, i, v))} />
      ))}

      {unreadable.map((u) => (
        <div className="card warn" key={u.id}>
          <div className="card-head">
            {collected.thumbs[u.id] && <img className="thumb" src={collected.thumbs[u.id]} alt={u.id} />}
            <div>
              <small>{u.id}</small>
              <p>{t.unreadable}</p>
              <small className="muted">{u.reason}</small>
              <br />
              <button className="link" onClick={() => addManualStatement(u.id)}>
                + {t.statement}
              </button>
            </div>
          </div>
        </div>
      ))}

      {(credits.length > 0 || collected.sms.skipped.length > 0) && (
        <div className="card">
          <strong>{t.credits}</strong>
          {credits.map((c, i) => (
            <CreditRow key={c.sourceId} c={c} onChange={(v) => setCredits((a) => at(a, i, v))} />
          ))}
          {collected.sms.skipped.length > 0 && (
            <details>
              <summary>
                {t.skipped}: {collected.sms.skipped.map((s) => s.reason).join(", ")}
              </summary>
              {collected.sms.skipped.map((s, i) => (
                <p className="muted" key={i}>
                  {s.text}
                </p>
              ))}
            </details>
          )}
        </div>
      )}

      {error && <p className="error">{error}</p>}
      <button className="primary" onClick={confirm} disabled={statements.length === 0 && notices.length === 0}>
        {t.confirmBtn}
      </button>
      <button className="secondary" onClick={onBack}>
        ←
      </button>
    </section>
  );
}
