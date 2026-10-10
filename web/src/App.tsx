import { useEffect, useState } from "react";
import { api, type DocketDraft, type Lang, type Ledger } from "./api";
import { strings } from "./i18n";
import { content } from "./content";
import { Collect, loadDemo, type Collected } from "./Collect";
import { Confirm } from "./Confirm";
import { Audit } from "./Audit";
import { Result } from "./Result";
import { Landing } from "./Landing";
import "./styles.css";

type Step =
  | { name: "home" }
  | { name: "collect" }
  | { name: "confirm"; collected: Collected }
  | { name: "audit"; collected: Collected; ledger: Ledger }
  | { name: "result"; collected: Collected; ledger: Ledger; draft: DocketDraft };

const FLOW = ["collect", "confirm", "audit", "result"] as const;

/** Scales-of-justice mark, drawn inline so there is no image asset to load. */
function Mark() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v17M7 20h10M5 7h14" />
      <path d="M5 7l-3 6a3 3 0 0 0 6 0L5 7zM19 7l-3 6a3 3 0 0 0 6 0l-3-6z" />
    </svg>
  );
}

export function App() {
  const [lang, setLang] = useState<Lang>("kn");
  const [step, setStep] = useState<Step>({ name: "home" });
  const [ai, setAi] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const t = strings(lang);
  const c = content(lang);

  useEffect(() => {
    api.health().then((h) => setAi(h.ai)).catch(() => setAi(null));
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    window.scrollTo(0, 0);
  }, [lang, step.name]);

  const smsById = (col: Collected) => Object.fromEntries(col.sms.credits.map((x) => [x.sourceId, x.rawText]));
  const toConfirm = (collected: Collected) => {
    setError("");
    setStep({ name: "confirm", collected });
  };
  async function demoFromHome() {
    setBusy(true);
    setError("");
    try {
      toConfirm(await loadDemo(lang));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const home = step.name === "home";
  const at = FLOW.indexOf(step.name as (typeof FLOW)[number]);

  return (
    <main>
      <header className="topbar no-print">
        <div className="topbar-in">
          <a
            className="brand"
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setStep({ name: "home" });
            }}
          >
            <Mark />
            <h1>Nyaya-Ledger</h1>
          </a>
          {home && (
            <nav className="nav">
              <a href="#how">{c.navHow}</a>
              <a href="#checks">{c.navChecks}</a>
              <a href="#rights">{c.navRights}</a>
              <a href="#faq">{c.navFaq}</a>
            </nav>
          )}
          <select className="lang" aria-label={t.language} value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
            <option value="kn">ಕನ್ನಡ</option>
            <option value="hi">हिन्दी</option>
            <option value="en">English</option>
          </select>
        </div>
      </header>

      {home && (
        <>
          {error && (
            <p className="error wrap" role="alert">
              {error}
            </p>
          )}
          <Landing t={t} c={c} busy={busy} onStart={() => setStep({ name: "collect" })} onDemo={demoFromHome} />
        </>
      )}

      {!home && (
        <div className="flow">
          <ol className="stepper no-print" aria-label="progress">
            {FLOW.map((s, i) => (
              <li key={s} className={i === at ? "on" : i < at ? "done" : ""} aria-current={i === at ? "step" : undefined}>
                {i + 1}. {c.stepNames[i]}
              </li>
            ))}
          </ol>

          {error && (
            <p className="error no-print" role="alert">
              {error}
            </p>
          )}

          {step.name === "collect" && <Collect t={t} c={c} lang={lang} ai={ai} onDone={toConfirm} />}
          {step.name === "confirm" && (
            <Confirm
              t={t}
              c={c}
              collected={step.collected}
              onBack={() => setStep({ name: "collect" })}
              onConfirm={(ledger) => setStep({ name: "audit", collected: step.collected, ledger: { ...ledger, inputs: { ...ledger.inputs, language: lang } } })}
            />
          )}
          {step.name === "audit" && (
            <Audit
              t={t}
              ledger={step.ledger}
              onDone={(draft) => setStep({ name: "result", collected: step.collected, ledger: step.ledger, draft })}
              onError={(msg) => {
                setError(msg);
                setStep({ name: "confirm", collected: step.collected });
              }}
            />
          )}
          {step.name === "result" && <Result t={t} c={c} draft={step.draft} ledger={step.ledger} smsText={smsById(step.collected)} onRestart={() => setStep({ name: "collect" })} />}
        </div>
      )}

      <footer className="site-footer no-print">
        <div className="site-footer-in">
          <p>{c.footerLegal}</p>
          <p>{c.footerMade}</p>
        </div>
      </footer>
    </main>
  );
}
