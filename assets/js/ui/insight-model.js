import { getId } from "../core/utils.js";

const IGNORED_METADATA_KEYS = new Set(["titre", "title", "resume", "summary", "relations"]);

export function getEntityMetadataEntries(entity, relatedCount, linkCount, { modelSchema, commentsByEntity }) {
  const type = modelSchema.types.find((item) => item.id === entity.type);
  const entries = [
    ["Type", type?.singular || entity.type],
    ["Identifiant", entity.id],
    ["Fichier", entity.path || "Non renseigné"]
  ];
  for (const field of type?.fields || []) {
    if (IGNORED_METADATA_KEYS.has(field.key) || entries.length >= 6) continue;
    const value = formatMetadataValue(entity[field.key]);
    if (value) entries.push([field.label, value]);
  }
  entries.push(
    ["Éléments liés", String(relatedCount)],
    ["Relations directes", String(linkCount)],
    ["Échanges", String((commentsByEntity[entity.id] || []).filter((comment) => !comment.deletedAt).length)]
  );
  return entries;
}

export function formatMetadataValue(value) {
  if (value == null || value === "") return "";
  if (Array.isArray(value)) return value.map((item) => typeof item === "object" ? item.target || item.id || "" : item).filter(Boolean).join(", ");
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (typeof value === "object") return "";
  return String(value);
}

export function formatManifestDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function getBreadcrumbEntities(selected, { entities, links, typeConfig }) {
  if (!selected) return [];
  const chain = [selected];
  const visited = new Set([selected.id]);
  let currentId = selected.id;
  while (chain.length < 5) {
    const current = entities.get(currentId);
    const currentOrder = typeConfig[current?.type]?.order ?? Number.MAX_SAFE_INTEGER;
    const parentLink = links.find((link) => {
      if (getId(link.source) !== currentId || ["related_to", "comment_on"].includes(link.type)) return false;
      const target = entities.get(getId(link.target));
      return (typeConfig[target?.type]?.order ?? Number.MAX_SAFE_INTEGER) < currentOrder;
    });
    const parentId = parentLink ? getId(parentLink.target) : null;
    const parent = parentId ? entities.get(parentId) : null;
    if (!parent || visited.has(parent.id)) break;
    chain.unshift(parent);
    visited.add(parent.id);
    currentId = parent.id;
  }
  return chain;
}
