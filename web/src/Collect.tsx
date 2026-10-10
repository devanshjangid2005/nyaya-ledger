import { useState } from "react";
import { api, type Extracted, type Lang, type Ledger, type SmsResult } from "./api";
import type { Strings } from "./i18n";

export interface Collected {
  extracted: Extracted[];
  thumbs: Record<string, string>; // image id → object URL
  sms: SmsResult;
  platform: string;
  inputs: Ledger["inputs"];
}

interface Props {
  t: Strings;
  lang: Lang;
  setLang: (l: Lang) => void;
  ai: boolean | null;
  onDone: (c: Collected) => void;
}

export function Collect({ t, lang, setLang, ai, onDone }: Props) {
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
      const d = await api.demo();
      const sms = await api.sms(d.smsText, d.platform);
      // Demo screenshots are pre-extracted (synthetic); shown as images in the Confirm step.
      const extracted: Extracted[] = [
        ...d.ledger.statements.map((s) => ({ id: s.sourceImage, status: "ok" as const, type: "statement" as const, data: s })),
        ...d.ledger.blockNotices.map((n) => ({ id: n.sourceImage, status: "ok" as const, type: "block_notice" as const, data: n })),
      ];
      const thumbs = Object.fromEntries(["statement-1", "statement-2", "block-notice"].map((id) => [id, `/demo/${id}.png`]));
      onDone({ extracted, thumbs, sms, platform: d.platform, inputs: { ...d.ledger.inputs, language: lang } });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <label className="field">
        {t.language}
        <select value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
          <option value="kn">ಕನ್ನಡ</option>
          <option value="hi">हिन्दी</option>
          <option value="en">English</option>
        </select>
      </label>

      <label className="field">
        {t.screenshots}
        <input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 8))} />
        {files.length > 0 && (
          <small>
            {files.length} {t.selected}
          </small>
        )}
        {ai === false && <small className="warn">{t.aiOff}</small>}
      </label>

      <label className="field">
        {t.smsLabel}
        <textarea rows={6} value={smsText} onChange={(e) => setSmsText(e.target.value)} placeholder="Rs.6,005.00 credited to A/c XX4821 on 06-10-26 by NEFT from …" />
        <small>{t.smsHint}</small>
      </label>

      <label className="field">
        {t.platform}
        <input value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="QUICKBITE" />
      </label>

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

      <p className="note">{t.privacy}</p>
      {error && <p className="error">{error}</p>}
      <button className="primary" disabled={busy} onClick={read}>
        {busy ? t.reading : t.readBtn}
      </button>
      <button className="secondary" disabled={busy} onClick={demo}>
        {t.demoBtn}
      </button>
    </section>
  );
}
