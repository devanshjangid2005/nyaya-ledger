import { useEffect, useRef, useState } from "react";
import { api, runAuditStream, type DocketDraft, type Ledger } from "./api";
import { STEP_LABEL, type Strings } from "./i18n";

/** Live view of the Cline SDK agent working: tool steps stream in; ask_worker questions appear inline. */
export function Audit({ t, ledger, onDone, onError }: { t: Strings; ledger: Ledger; onDone: (d: DocketDraft) => void; onError: (msg: string) => void }) {
  const [steps, setSteps] = useState<string[]>([]);
  const [question, setQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [fallback, setFallback] = useState<string | null>(null);
  const session = useRef("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // StrictMode double-invoke guard
    started.current = true;
    const ctrl = new AbortController();
    runAuditStream(
      ledger,
      {
        onSession: (id) => (session.current = id),
        onStep: (tool) => setSteps((s) => [...s, STEP_LABEL[ledger.inputs.language][tool] ?? tool]),
        onQuestion: (q) => setQuestion(q),
        onFallback: (r) => setFallback(r),
      },
      ctrl.signal,
    )
      .then(onDone)
      .catch((e: Error) => e.name !== "AbortError" && onError(e.message));
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function send() {
    const a = answer.trim() || "I don't know";
    setQuestion(null);
    setAnswer("");
    setSteps((s) => [...s, `${t.you}: ${a}`]);
    await api.answer(session.current, a).catch(() => undefined);
  }

  return (
    <section>
      <h2>{t.auditing}</h2>
      <ol className="steps">
        {steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
        {!question && <li className="spinner">…</li>}
      </ol>
      {fallback && <p className="note">{t.noAi}</p>}
      {question && (
        <div className="card ask">
          <p>{question}</p>
          <input aria-label={t.yourAnswer} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder={t.yourAnswer} onKeyDown={(e) => e.key === "Enter" && send()} />
          <button className="primary" onClick={send}>
            {t.send}
          </button>
        </div>
      )}
    </section>
  );
}
