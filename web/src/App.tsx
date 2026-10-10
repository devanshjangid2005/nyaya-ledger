import { useEffect, useState } from "react";

// Phase 0 placeholder: proves web → API proxy works. Replaced by the 4-step flow in Phase 3.
export function App() {
  const [health, setHealth] = useState<string>("checking…");

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((h) => setHealth(h.ok ? `API ok · ${h.provider ?? "no provider"} / ${h.model ?? "no model"}` : "API error"))
      .catch(() => setHealth("API not reachable"));
  }, []);

  return (
    <main style={{ maxWidth: 390, margin: "0 auto", padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1>Nyaya-Ledger</h1>
      <p>Payout screenshots + bank SMS → grievance docket.</p>
      <p>
        <small>{health}</small>
      </p>
    </main>
  );
}
