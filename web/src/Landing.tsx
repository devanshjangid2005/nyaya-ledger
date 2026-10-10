import type { Content } from "./content";
import type { Strings } from "./i18n";

/** Public landing page: what the service does, what it checks, the worker's rights (verbatim Act), privacy, FAQ. */
export function Landing({ t, c, busy, onStart, onDemo }: { t: Strings; c: Content; busy: boolean; onStart: () => void; onDemo: () => void }) {
  return (
    <div className="landing">
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <span className="eyebrow">{c.eyebrow}</span>
            <h2>{c.heroTitle}</h2>
            <p className="lead">{c.heroLead}</p>
            <div className="btn-row">
              <button className="primary" onClick={onStart}>
                {c.start}
              </button>
              <button className="secondary" disabled={busy} onClick={onDemo}>
                {t.demoBtn}
              </button>
            </div>
            <ul className="trust">
              {c.trust.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
          <div className="preview" aria-hidden="true">
            <div className="preview-head">
              <b>{c.previewTitle}</b>
              <small>{c.previewTag}</small>
            </div>
            {c.previewRows.map(([label, value]) => (
              <div className="preview-row" key={label}>
                <span>{label}</span>
                <span>{value}</span>
              </div>
            ))}
            <p className="preview-cite">Section 15(1): “…must inform the platform based Gig worker about the reasons for such deductions…”</p>
          </div>
        </div>
      </section>

      <section className="band alt" id="how">
        <div className="wrap">
          <h2>{c.howTitle}</h2>
          <p className="sub">{c.howSub}</p>
          <div className="grid g4">
            {c.how.map(([title, text], i) => (
              <div className="tile" key={title}>
                <span className="num">{i + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="band" id="checks">
        <div className="wrap">
          <h2>{c.checksTitle}</h2>
          <p className="sub">{c.checksSub}</p>
          <div className="grid g3">
            {c.checks.map(([title, text, sec]) => (
              <div className="tile" key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
                <span className="sec">{sec}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="band alt" id="rights">
        <div className="wrap">
          <h2>{c.rightsTitle}</h2>
          <p className="sub">{c.rightsSub}</p>
          <ul className="rights">
            {c.rights.map(([title, sec, quote]) => (
              <li key={sec}>
                <b>{title}</b>
                <small className="muted">{sec}, Karnataka Platform Based Gig Workers (Social Security and Welfare) Act, 2025</small>
                <blockquote>“…{quote}…”</blockquote>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <h2>{c.trustTitle}</h2>
          <div className="grid g3" style={{ marginTop: 16 }}>
            {c.trustItems.map(([title, text]) => (
              <div className="tile" key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="band alt faq" id="faq">
        <div className="wrap">
          <h2>{c.faqTitle}</h2>
          <div style={{ marginTop: 16, maxWidth: 720 }}>
            {c.faq.map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="band cta">
        <div className="wrap">
          <h2>{c.ctaTitle}</h2>
          <p className="sub" style={{ margin: "0 auto" }}>
            {c.ctaSub}
          </p>
          <button className="primary" onClick={onStart}>
            {c.start}
          </button>
        </div>
      </section>
    </div>
  );
}
