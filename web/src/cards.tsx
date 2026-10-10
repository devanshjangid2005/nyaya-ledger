import type { BankCredit, Ledger } from "./api";
import type { Strings } from "./i18n";

export type Statement = Ledger["statements"][number];
export type Notice = Ledger["blockNotices"][number];
type Line = Statement["lines"][number];

export const num = (v: string) => (v.trim() === "" || Number.isNaN(Number(v)) ? 0 : Number(v));

export function StatementCard({ t, s, thumb, onChange }: { t: Strings; s: Statement; thumb?: string; onChange: (s: Statement) => void }) {
  const line = (k: number, patch: Partial<Line>) => onChange({ ...s, lines: s.lines.map((l, m) => (m === k ? { ...l, ...patch } : l)) });
  return (
    <div className="card">
      <div className="card-head">
        {thumb && <img className="thumb" src={thumb} alt={s.sourceImage} />}
        <div>
          <strong>{t.statement}</strong> <small>{s.sourceImage}</small>
          <div className="row">
            <input aria-label="period start" value={s.periodStart} onChange={(e) => onChange({ ...s, periodStart: e.target.value })} placeholder="YYYY-MM-DD" />
            <input aria-label="period end" value={s.periodEnd} onChange={(e) => onChange({ ...s, periodEnd: e.target.value })} placeholder="YYYY-MM-DD" />
          </div>
          <label className="inline">
            {t.netPayout}
            <input aria-label="net payout" inputMode="decimal" value={String(s.netPayoutShown)} onChange={(e) => onChange({ ...s, netPayoutShown: num(e.target.value) })} />
          </label>
        </div>
      </div>
      <table className="lines">
        <tbody>
          {s.lines.map((l, k) => (
            <tr key={k} className={l.kind}>
              <td>
                <select value={l.kind} onChange={(e) => line(k, { kind: e.target.value as Line["kind"] })}>
                  <option value="earning">{t.kindEarning}</option>
                  <option value="incentive">{t.kindIncentive}</option>
                  <option value="deduction">{t.kindDeduction}</option>
                </select>
              </td>
              <td>
                {/* textarea so long labels wrap instead of being cut off; newlines are not allowed */}
                <textarea aria-label="label" rows={1} value={l.label} onChange={(e) => line(k, { label: e.target.value.replace(/\s*\n\s*/g, " ") })} />
              </td>
              <td>
                <input aria-label="amount" className="amt" inputMode="decimal" value={String(l.amount)} onChange={(e) => line(k, { amount: Math.abs(num(e.target.value)) })} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="link" onClick={() => onChange({ ...s, lines: [...s.lines, { kind: "deduction", label: "", amount: 0, sourceImage: s.sourceImage }] })}>
        {t.addLine}
      </button>
    </div>
  );
}

export function NoticeCard({ t, n, thumb, onChange }: { t: Strings; n: Notice; thumb?: string; onChange: (n: Notice) => void }) {
  return (
    <div className="card">
      <div className="card-head">
        {thumb && <img className="thumb" src={thumb} alt={n.sourceImage} />}
        <div>
          <strong>{t.notice}</strong> <small>{n.sourceImage}</small>
          <div className="row">
            <input aria-label="notice date" value={n.noticeDate} onChange={(e) => onChange({ ...n, noticeDate: e.target.value })} placeholder="YYYY-MM-DD" />
            <input aria-label="effective date" value={n.effectiveDate} onChange={(e) => onChange({ ...n, effectiveDate: e.target.value })} placeholder="YYYY-MM-DD" />
          </div>
          <input aria-label="reason" value={n.reasonText ?? ""} onChange={(e) => onChange({ ...n, reasonText: e.target.value })} placeholder={t.reasonPlaceholder} />
        </div>
      </div>
    </div>
  );
}

export function CreditRow({ c, onChange }: { c: BankCredit; onChange: (c: BankCredit) => void }) {
  return (
    <label className="credit">
      <input type="checkbox" checked={c.fromPlatform} onChange={(e) => onChange({ ...c, fromPlatform: e.target.checked })} />
      <input aria-label="credit date" value={c.date} onChange={(e) => onChange({ ...c, date: e.target.value })} />
      <input aria-label="credit amount" className="amt" inputMode="decimal" value={String(c.amount)} onChange={(e) => onChange({ ...c, amount: num(e.target.value) || 0.01 })} />
      <small>{c.payer ?? ""}</small>
    </label>
  );
}
