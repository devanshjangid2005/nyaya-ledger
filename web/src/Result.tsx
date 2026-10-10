import { useState } from "react";
import type { DocketDraft, Ledger } from "./api";
import type { Strings } from "./i18n";
import type { Content } from "./content";

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
const section = (id: string) => id.replace(/^KA-(\d+)-(\d+)$/, "Section $1($2)");

export function Result({ t, c, draft, ledger, smsText, onRestart }: { t: Strings; c: Content; draft: DocketDraft; ledger: Ledger; smsText: Record<string, string>; onRestart: () => void }) {
  const label = { possible_issue: t.possible, ok: t.ok, info: t.info, needs_input: "?" } as const;
  const period = ledger.statements[0] ? `${ledger.statements[0].periodStart} → ${ledger.statements[0].periodEnd}` : "";
  const evidenceSms = ledger.bankCredits.filter((cr) => draft.findings.some((f) => f.evidence.includes(cr.sourceId)));
  const count = (s: string) => draft.findings.filter((f) => f.status === s).length;
  const today = new Date().toLocaleDateString("en-IN");

  return (
    <section className="docket">
      <header className="print-only">
        <h1>Nyaya-Ledger · Grievance evidence docket</h1>
        <p>
          Period: {period} · Generated: {today}
        </p>
      </header>

      <div className="docket-head no-print">
        <h2>{c.docketTitle}</h2>
        <p>
          {period && <>{period} · </>}
          {c.generated}: {today}
        </p>
      </div>

      <p className="disclaimer">{t.disclaimer}</p>
      {draft.generatedBy === "fallback" && <p className="note">{t.noAi}</p>}

      <div className="summary-box">
        <div className="issue">
          <b>{count("possible_issue")}</b>
          <small>{c.sumIssues}</small>
        </div>
        <div className="okk">
          <b>{count("ok")}</b>
          <small>{c.sumOk}</small>
        </div>
        <div>
          <b>{count("info")}</b>
          <small>{c.sumInfo}</small>
        </div>
      </div>

      <h2>{t.results}</h2>
      <p>{draft.summary}</p>

      <h3 style={{ marginTop: 18 }}>{c.findingsTitle}</h3>
      {draft.findings.map((f, i) => (
        <article key={i} className={`finding ${f.status}`}>
          <div className="finding-head">
            <span className="badge">{label[f.status]}</span> <small>{f.checkId}</small>
          </div>
          <strong>{f.title}</strong>
          <p className="arith">{f.arithmetic}</p>
          {f.evidence.length > 0 && (
            <p className="evidence">
              {t.evidence}: {f.evidence.join(", ")}
            </p>
          )}
          {f.clauseIds.length > 0 && (
            <p className="evidence">
              {t.act}: {f.clauseIds.map(section).join(", ")}
            </p>
          )}
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
        <h3>Karnataka Platform Based Gig Workers (Social Security and Welfare) Act, 2025: {t.quoted}</h3>
        {draft.citations.map((cit) => (
          <blockquote key={cit.id}>
            <strong>{section(cit.id)}</strong> {cit.text}
          </blockquote>
        ))}
      </div>

      {evidenceSms.length > 0 && (
        <div className="card">
          <h3>{t.smsEvidence}</h3>
          {evidenceSms.map((cr) => (
            <p key={cr.sourceId} className="evidence">
              <strong>{cr.sourceId}</strong> {smsText[cr.sourceId] ?? cr.rawText}
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
