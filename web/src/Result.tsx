import { useState } from "react";
import type { DocketDraft, Ledger } from "./api";
import type { Strings } from "./i18n";

const IPGRS_URL = "https://ipgrs.karnataka.gov.in/";

function CopyBtn({ t, text }: { t: Strings; text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="link no-print"
      onClick={() =>
        navigator.clipboard.writeText(text).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        })
      }
    >
      {done ? t.copied : t.copy}
    </button>
  );
}

/**
 * Findings + letter on screen; the same page is the docket. "Save as PDF" uses the browser's
 * print dialog (Android Chrome: Share/Print → Save as PDF), so Kannada renders with system fonts
 * and the server needs no headless browser.
 */
export function Result({ t, draft, ledger, smsText, onRestart }: { t: Strings; draft: DocketDraft; ledger: Ledger; smsText: Record<string, string>; onRestart: () => void }) {
  const label = { possible_issue: t.possible, ok: t.ok, info: t.info, needs_input: "?" } as const;
  const period = ledger.statements[0] ? `${ledger.statements[0].periodStart} → ${ledger.statements[0].periodEnd}` : "";
  const evidenceSms = ledger.bankCredits.filter((c) => draft.findings.some((f) => f.evidence.includes(c.sourceId)));

  return (
    <section className="docket">
      <header className="print-only">
        <h1>Nyaya-Ledger · Grievance evidence docket</h1>
        <p>
          Period: {period} · Generated: {new Date().toLocaleDateString("en-IN")}
        </p>
      </header>

      <p className="disclaimer">{t.disclaimer}</p>
      {draft.generatedBy === "fallback" && <p className="note">{t.noAi}</p>}

      <h2>{t.results}</h2>
      <p>{draft.summary}</p>

      {draft.findings.map((f, i) => (
        <article key={i} className={`finding ${f.status}`}>
          <div className="finding-head">
            <span className="badge">{label[f.status]}</span> <small>{f.checkId}</small>
          </div>
          <strong>{f.title}</strong>
          <p className="arith">{f.arithmetic}</p>
          {f.evidence.length > 0 && <p className="evidence">Evidence: {f.evidence.join(", ")}</p>}
          {f.clauseIds.length > 0 && <p className="evidence">Act: {f.clauseIds.join(", ")}</p>}
        </article>
      ))}

      <div className="card">
        <div className="card-title">
          <h3>{t.letter}</h3>
          <CopyBtn t={t} text={draft.letter} />
        </div>
        <pre className="letter">{draft.letter}</pre>
      </div>

      <div className="card">
        <div className="card-title">
          <h3>{t.s13}</h3>
          <CopyBtn t={t} text={draft.s13Request} />
        </div>
        <pre className="letter">{draft.s13Request}</pre>
      </div>

      <div className="card">
        <h3>Karnataka Platform Based Gig Workers (Social Security and Welfare) Act, 2025: quoted sections</h3>
        {draft.citations.map((c) => (
          <blockquote key={c.id}>
            <strong>{c.id.replace(/^KA-(\d+)-(\d+)$/, "Section $1($2)")}</strong> {c.text}
          </blockquote>
        ))}
      </div>

      {evidenceSms.length > 0 && (
        <div className="card">
          <h3>Evidence: bank SMS</h3>
          {evidenceSms.map((c) => (
            <p key={c.sourceId} className="evidence">
              <strong>{c.sourceId}</strong> {smsText[c.sourceId] ?? c.rawText}
            </p>
          ))}
        </div>
      )}

      <div className="actions no-print">
        <button className="primary" onClick={() => window.print()}>
          {t.savePdf}
        </button>
        <a className="secondary button" href={IPGRS_URL} target="_blank" rel="noreferrer">
          {t.openIpgrs}
        </a>
        <button className="secondary" onClick={onRestart}>
          {t.startOver}
        </button>
      </div>
    </section>
  );
}
