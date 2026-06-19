import {
  FALLBACK_MODEL_SCHEMA,
  MODEL_SCHEMA_VERSION,
  TYPE_CONFIG
} from "../core/config.js";

export function normalizeModelSchema(schema) {
  const source = schema && Array.isArray(schema.types) ? schema : FALLBACK_MODEL_SCHEMA;
  const seen = new Set();
  const types = source.types.map((type, index) => {
    const id = String(type.id || "").trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "_");
    if (!id || seen.has(id)) return null;
    seen.add(id);
    const fallback = FALLBACK_MODEL_SCHEMA.types.find((item) => item.id === id);
    const fields = Array.isArray(type.fields) ? type.fields : fallback?.fields || [];
    return {
      id,
      label: String(type.label || fallback?.label || id),
      singular: String(type.singular || fallback?.singular || type.label || id),
      folder: String(type.folder || fallback?.folder || `${id}s`).replace(/^\/+|\/+$/g, ""),
      color: /^#[0-9a-f]{6}$/i.test(type.color) ? type.color : fallback?.color || "#7dd3fc",
      size: Math.max(6, Math.min(30, Number(type.size || fallback?.size || 12))),
      order: Number.isFinite(Number(type.order)) ? Number(type.order) : index,
      showLabel: type.showLabel ?? fallback?.showLabel ?? Number(type.size || fallback?.size || 12) >= 15,
      fields: fields.map(normalizeSchemaField).filter(Boolean)
    };
  }).filter(Boolean);
  return {
    version: String(source.version || MODEL_SCHEMA_VERSION),
    updatedAt: source.updatedAt || null,
    relations: normalizeRelationTypes(source.relations),
    types
  };
}

function normalizeRelationTypes(relations) {
  if (!relations || typeof relations !== "object" || Array.isArray(relations)) return {};
  return Object.fromEntries(Object.entries(relations).map(([id, config]) => [
    id,
    {
      label: String(typeof config === "string" ? config : config?.label || id)
    }
  ]));
}

export function normalizeSchemaField(field) {
  const key = String(field?.key || "").trim().replace(/[^a-zA-Z0-9_]+/g, "_");
  if (!key) return null;
  const kind = ["text", "textarea", "number", "boolean", "select", "reference"].includes(field.kind)
    ? field.kind
    : "text";
  return {
    key,
    label: String(field.label || key),
    kind,
    required: Boolean(field.required),
    multiple: Boolean(field.multiple),
    target: kind === "reference" ? String(field.target || "*") : undefined,
    values: kind === "select"
      ? [...new Set((field.values || []).map((value) => String(value).trim()).filter(Boolean))]
      : undefined
  };
}

export function applyTypeRegistry(schema) {
  for (const key of Object.keys(TYPE_CONFIG)) delete TYPE_CONFIG[key];
  for (const type of schema.types) {
    TYPE_CONFIG[type.id] = {
      label: type.label,
      singular: type.singular,
      color: type.color,
      size: type.size,
      order: type.order,
      showLabel: type.showLabel
    };
  }
}
