import { normalizeSearchText } from "../core/utils.js";

export function getSearchExcerpt(item, value, matches = []) {
  const bodyMatch = matches?.find((match) => ["body", "summary", "metadata", "label"].includes(match.key));
  const source = String(item[bodyMatch?.key] || item.body || item.summary || item.label || "");
  const matchIndex = bodyMatch?.indices?.[0]?.[0] ?? normalizeSearchText(source).indexOf(normalizeSearchText(value));
  return makeExcerpt(source, matchIndex);
}

export function getFallbackExcerpt(item, term) {
  const source = [item.summary, item.body, item.metadata].filter(Boolean).join("\n");
  const index = normalizeSearchText(source).indexOf(term);
  return makeExcerpt(source, index);
}

export function makeExcerpt(text, index) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const start = Math.max(0, index > -1 ? index - 42 : 0);
  const excerpt = clean.slice(start, start + 128);
  return `${start > 0 ? "…" : ""}${excerpt}${start + 128 < clean.length ? "…" : ""}`;
}
