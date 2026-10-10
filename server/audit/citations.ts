import { readFileSync } from "node:fs";

const corpus = JSON.parse(
  readFileSync(new URL("../../legal/karnataka-2025.json", import.meta.url), "utf8"),
) as { act: string; clauses: Record<string, string> };
const CLAUSES = corpus.clauses;

/** Throws if any cited id is unknown. Returns verbatim clause text from the corpus, never from the model. */
export function resolveCitations(ids: string[]) {
  const unique = [...new Set(ids)];
  const unknown = unique.filter((id) => !(id in CLAUSES));
  if (unknown.length) throw new Error(`Unknown clause ids: ${unknown.join(", ")}. Use lookup_clause and cite only known ids.`);
  return unique.map((id) => ({ id, text: CLAUSES[id] }));
}

export const lookupClause = (id: string): string | null => CLAUSES[id] ?? null;
export const ACT_NAME = corpus.act;
