export function shortLabel(text, max) {
  const value = String(text || "");
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export function safeFileName(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "fiche";
}

export function makeDatasetId(text) {
  let hash = 0;
  const value = String(text || "");
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return `d${Math.abs(hash)}`;
}

export function groupBy(items, key) {
  return items.reduce((groups, item) => {
    groups[item[key]] ||= [];
    groups[item[key]].push(item);
    return groups;
  }, {});
}

export function getId(value) {
  return typeof value === "object" ? value?.id : value;
}

export function humanStatus(status) {
  return ({
    raw: "Brouillon",
    normalized: "Consolidé",
    reviewed: "Relu",
    validated: "Validé",
    deprecated: "Écarté"
  })[status] || status || "—";
}

export function loadJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

export function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

export function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function cssEscape(value) {
  if (window.CSS?.escape) return window.CSS.escape(value);
  return String(value).replace(/["\\]/g, "\\$&");
}

export function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function normalizePackPath(path) {
  const parts = [];
  for (const part of String(path || "").replace(/\\/g, "/").split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") parts.pop();
    else parts.push(part);
  }
  return parts.join("/");
}

export function getRelativePackPath(fromPath, targetPath) {
  const from = normalizePackPath(fromPath).split("/");
  from.pop();
  const target = normalizePackPath(targetPath).split("/");
  while (from.length && target.length && from[0] === target[0]) {
    from.shift();
    target.shift();
  }
  return [...from.map(() => ".."), ...target].join("/");
}
