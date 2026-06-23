import { escapeHtml, normalizeSearchText } from "../core/utils.js";

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

export function buildSearchDocuments(nodes) {
  return [...nodes]
    .filter((node) => node.type !== "contribution")
    .map((node) => {
      const metadata = Object.entries(node)
        .filter(([key, value]) => !["body", "rawText", "imageURL"].includes(key) && typeof value !== "object")
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n");
      return {
        id: node.id,
        type: node.type,
        label: node.label || "",
        summary: node.summary || "",
        body: node.body || "",
        tags: Array.isArray(node.tags) ? node.tags.join(" ") : String(node.tags || ""),
        keywords: Array.isArray(node.keywords) ? node.keywords.join(" ") : String(node.keywords || ""),
        metadata,
        haystack: getSearchText(node)
      };
    });
}

export function getSearchText(node) {
  return normalizeSearchText([node.id, node.label, node.summary, ...(node.keywords || []), ...(node.tags || []), node.body].join(" "));
}

export function fallbackSearchDocuments(docs, value, limit) {
  const term = normalizeSearchText(value);
  return (docs || [])
    .filter((item) => item.haystack.includes(term))
    .slice(0, limit)
    .map((item) => ({ item, score: 0.5, excerpt: getFallbackExcerpt(item, term) }));
}

export function makeExcerpt(text, index) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const start = Math.max(0, index > -1 ? index - 42 : 0);
  const excerpt = clean.slice(start, start + 128);
  return `${start > 0 ? "…" : ""}${excerpt}${start + 128 < clean.length ? "…" : ""}`;
}

export function renderSearchResultsView({ searchTerm, results, activeIndex, entities, typeConfig }) {
  if (!searchTerm) {
    return {
      status: "Tapez un mot-clé, un titre ou un fragment de contenu.",
      html: ""
    };
  }
  if (!results.length) {
    return {
      status: "Aucun résultat.",
      html: `<p class="empty-state compact">Aucune fiche ne correspond à cette recherche.</p>`
    };
  }
  return {
    status: `${results.length} résultat${results.length > 1 ? "s" : ""}`,
    html: results.map((result, index) => renderSearchResultItem(result, index, {
      active: index === activeIndex,
      entity: entities.get(result.item.id),
      typeConfig
    })).join("")
  };
}

function renderSearchResultItem(result, index, { active, entity, typeConfig }) {
  const type = typeConfig[entity?.type]?.singular || entity?.type || "Fiche";
  return `
    <button class="graph-search-result ps-card ps-surface${active ? " active" : ""}" type="button" role="option" aria-selected="${active}" data-search-index="${index}">
      <span class="dot" style="background:${typeConfig[entity?.type]?.color || "#9aa6ad"}"></span>
      <span class="ps-meta-item">
        <strong>${escapeHtml(result.item.label)}</strong>
        <small>${escapeHtml(type)} · ${escapeHtml(result.excerpt || result.item.summary || "")}</small>
      </span>
    </button>
  `;
}
