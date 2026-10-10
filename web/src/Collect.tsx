import { useState } from "react";
import { api, type Extracted, type Lang, type Ledger, type SmsResult } from "./api";
import type { Strings } from "./i18n";
import type { Content } from "./content";

export interface Collected {
  extracted: Extracted[];
  thumbs: Record<string, string>; // image id → object URL
  sms: SmsResult;
  platform: string;
  inputs: Ledger["inputs"];
}

interface Props {
  t: Strings;
  c: Content;
  lang: Lang;
  ai: boolean | null;
  onDone: (c: Collected) => void;
}

/** Ravi's synthetic week: pre-extracted statements + notice, SMS parsed by the server. Used by Landing and Collect. */
export async function loadDemo(lang: Lang): Promise<Collected> {
  const d = await api.demo();
  const sms = await api.sms(d.smsText, d.platform);
  const extracted: Extracted[] = [
    ...d.ledger.statements.map((s) => ({ id: s.sourceImage, status: "ok" as const, type: "statement" as const, data: s })),
    ...d.ledger.blockNotices.map((n) => ({ id: n.sourceImage, status: "ok" as const, type: "block_notice" as const, data: n })),
  ];
  const thumbs = Object.fromEntries(["statement-1", "statement-2", "block-notice"].map((id) => [id, `/demo/${id}.png`]));
  return { extracted, thumbs, sms, platform: d.platform, inputs: { ...d.ledger.inputs, language: lang } };
}

export function Collect({ t, c, lang, ai, onDone }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [smsText, setSmsText] = useState("");
  const [platform, setPlatform] = useState("");
  const [hours, setHours] = useState("");
  const [fuel, setFuel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const inputs = (): Ledger["inputs"] => ({ loggedInHours: Number(hours) || 1, fuelCost: Number(fuel) || 0, upkeepCost: 0, language: lang });

  async function read() {
    setError("");
    if (files.length === 0 && !smsText.trim()) return setError(t.errNothing);
    if (!(Number(hours) > 0)) return setError(t.errHours);
    setBusy(true);
    try {
      const [ex, sms] = await Promise.all([
        files.length ? api.extract(files) : Promise.resolve({ results: [] as Extracted[] }),
        smsText.trim() ? api.sms(smsText, platform) : Promise.resolve({ credits: [], skipped: [] }),
      ]);
      const thumbs = Object.fromEntries(files.map((f, i) => [`img-${i + 1}`, URL.createObjectURL(f)]));
      onDone({ extracted: ex.results, thumbs, sms, platform, inputs: inputs() });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function demo() {
    setBusy(true);
    setError("");
    try {
      onDone(await loadDemo(lang));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <div className="page-head">
        <h2>{c.collectTitle}</h2>
        <p>{c.collectLead}</p>
      </div>

      <div className="demo-box">
        <strong>{c.demoTitle}</strong>
        <p>{c.demoText}</p>
        <button className="secondary" disabled={busy} onClick={demo}>
          {t.demoBtn}
        </button>
      </div>

      <div className="section">
        <div className="section-head">
          <span className="n">1</span>
          <h3>{c.secScreens}</h3>
        </div>
        <p className="hint">{c.secScreensHint}</p>
        <label className="drop">
          <input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 8))} />
          <span>{c.tapToAdd}</span>
          <small>
            {files.length > 0 ? `${files.length} ${t.selected}` : c.upTo}
          </small>
        </label>
        {files.length > 0 && (
          <div className="chips">
            {files.map((f, i) => (
              <span className="chip" key={i}>
                {f.name}
              </span>
            ))}
          </div>
        )}
        {ai === false && <p className="warn note">{t.aiOff}</p>}
      </div>

      <div className="section">
        <div className="section-head">
          <span className="n">2</span>
          <h3>{c.secSms}</h3>
        </div>
        <label className="field">
          {t.smsLabel}
          <textarea rows={5} value={smsText} onChange={(e) => setSmsText(e.target.value)} placeholder="Rs.6,005.00 credited to A/c XX4821 on 06-10-26 by NEFT from …" />
          <small>{t.smsHint}</small>
        </label>
        <label className="field">
          {t.platform}
          <input value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="QUICKBITE" />
        </label>
      </div>

      <div className="section">
        <div className="section-head">
          <span className="n">3</span>
          <h3>{c.secWeek}</h3>
        </div>
        <div className="row">
          <label className="field">
            {t.hours}
            <input inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="52" />
          </label>
          <label className="field">
            {t.fuel}
            <input inputMode="decimal" value={fuel} onChange={(e) => setFuel(e.target.value)} placeholder="1450" />
          </label>
        </div>
      </div>

      <p className="note">🔒 {t.privacy}</p>
      {error && <p className="error">{error}</p>}
      <button className="primary" disabled={busy} onClick={read}>
        {busy ? t.reading : t.readBtn}
      </button>
    </section>
  );
}
