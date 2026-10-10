import { useEffect, useState } from "react";
import { api, type DocketDraft, type Lang, type Ledger } from "./api";
import { strings } from "./i18n";
import { Collect, type Collected } from "./Collect";
import { Confirm } from "./Confirm";
import { Audit } from "./Audit";
import { Result } from "./Result";
import "./styles.css";

type Step = { name: "collect" } | { name: "confirm"; collected: Collected } | { name: "audit"; collected: Collected; ledger: Ledger } | { name: "result"; collected: Collected; ledger: Ledger; draft: DocketDraft };

export function App() {
  const [lang, setLang] = useState<Lang>("kn");
  const [step, setStep] = useState<Step>({ name: "collect" });
  const [ai, setAi] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const t = strings(lang);

  useEffect(() => {
    api.health().then((h) => setAi(h.ai)).catch(() => setAi(null));
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    window.scrollTo(0, 0);
  }, [lang, step.name]);

  const smsById = (c: Collected) => Object.fromEntries(c.sms.credits.map((x) => [x.sourceId, x.rawText]));

  return (
    <main>
      <header className="brand no-print">
        <h1>Nyaya-Ledger</h1>
        <p>{t.tagline}</p>
        <ol className="progress">
          {(["collect", "confirm", "audit", "result"] as const).map((s, i) => (
            <li key={s} className={s === step.name ? "on" : ""}>
              {i + 1}
            </li>
          ))}
        </ol>
      </header>

      {error && (
        <p className="error no-print" role="alert">
          {error}
        </p>
      )}

      {step.name === "collect" && (
        <Collect
          t={t}
          lang={lang}
          setLang={setLang}
          ai={ai}
          onDone={(collected) => {
            setError("");
            setStep({ name: "confirm", collected });
          }}
        />
      )}
      {step.name === "confirm" && (
        <Confirm
          t={t}
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
      {step.name === "result" && <Result t={t} draft={step.draft} ledger={step.ledger} smsText={smsById(step.collected)} onRestart={() => setStep({ name: "collect" })} />}

      <footer className="no-print">
        <small>Not legal advice · Synthetic demo data available · Built with Cline</small>
      </footer>
    </main>
  );
}
