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

export function validateModelSchema(schema) {
  if (!schema.types.length) return ["Le schéma doit contenir au moins un type"];
  const ids = new Set();
  for (const type of schema.types) {
    if (!type.label.trim() || !type.singular.trim()) return [`Le type ${type.id} doit avoir un libellé`];
    if (ids.has(type.id)) return [`Identifiant de type dupliqué : ${type.id}`];
    ids.add(type.id);
    const keys = new Set();
    for (const field of type.fields) {
      if (keys.has(field.key)) return [`Clé YAML dupliquée dans ${type.label} : ${field.key}`];
      keys.add(field.key);
      if (field.kind === "select" && !field.values?.length) return [`Le champ ${field.label} doit contenir au moins une valeur`];
    }
  }
  return [];
}

export function getSchemaCompatibilityReport(schema, entities, { hiddenNodeTypes, parseMarkdownFile }) {
  const errors = [];
  const warnings = [];
  let valid = 0;
  const types = new Map(schema.types.map((type) => [type.id, type]));
  for (const entity of entities.values()) {
    if (hiddenNodeTypes.has(entity.type)) continue;
    const type = types.get(entity.type);
    if (!type) {
      errors.push({ level: "error", message: `${entity.label} utilise le type absent « ${entity.type} ».` });
      continue;
    }
    const parsed = parseMarkdownFile(entity.rawText || "");
    const missing = type.fields.filter((field) => field.required && parsed.meta[field.key] == null && !(field.key === "titre" && entity.label));
    if (missing.length) {
      warnings.push({ level: "warning", message: `${entity.label} : ${missing.map((field) => field.label).join(", ")} manquant(s).` });
    } else {
      valid += 1;
    }
  }
  const issueCount = errors.length + warnings.length;
  const entityCount = getSchemaEntityCount(schema, entities);
  const score = entityCount ? Math.max(0, Math.round((1 - issueCount / entityCount) * 100)) : 100;
  return { errors: errors.slice(0, 12), warnings: warnings.slice(0, 12), valid, score };
}

export function getSchemaEntityCount(schema, entities) {
  const typeIds = new Set(schema.types.map((type) => type.id));
  return [...entities.values()].filter((entity) => typeIds.has(entity.type)).length;
}

export function getSelectedSchemaType(schema, selectedTypeId) {
  return schema.types.find((type) => type.id === selectedTypeId) || schema.types[0] || null;
}

export function getSelectedSchemaField(schema, selectedTypeId, selectedFieldKey) {
  return getSelectedSchemaType(schema, selectedTypeId)
    ?.fields.find((field) => field.key === selectedFieldKey) || null;
}

export function applySchemaTypeInput(schema, typeId, prop, value) {
  const type = schema.types.find((item) => item.id === typeId);
  if (!type) return null;
  type[prop] = value;
  return type;
}

export function applySchemaFieldInput(schema, selectedTypeId, selectedFieldKey, prop, value) {
  const field = getSelectedSchemaField(schema, selectedTypeId, selectedFieldKey);
  if (!field) return null;
  field[prop] = value;
  if (prop === "kind") {
    field.values = field.kind === "select" ? field.values || [] : undefined;
    field.target = field.kind === "reference" ? field.target || "*" : undefined;
  }
  return field;
}

export function parseSchemaFieldValues(value) {
  return [...new Set(String(value || "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean))];
}

export function reorderSchemaTypes(schema, sourceId, targetId) {
  const ordered = [...schema.types].sort((a, b) => a.order - b.order);
  const sourceIndex = ordered.findIndex((type) => type.id === sourceId);
  const targetIndex = ordered.findIndex((type) => type.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0) return false;
  const [moved] = ordered.splice(sourceIndex, 1);
  ordered.splice(targetIndex, 0, moved);
  ordered.forEach((type, index) => {
    type.order = index;
  });
  schema.types = ordered;
  return true;
}

export function createSchemaType({ id, label, order }) {
  return {
    id,
    label: label.trim().endsWith("s") ? label.trim() : `${label.trim()}s`,
    singular: label.trim(),
    folder: `${id}s`,
    color: "#7dd3fc",
    size: 12,
    order,
    showLabel: true,
    fields: [{ key: "titre", label: "Titre", kind: "text", required: true }]
  };
}

export function removeSchemaType(schema, typeId) {
  schema.types = schema.types.filter((type) => type.id !== typeId);
}

export function createSchemaField({ key, label }) {
  return { key, label: label.trim(), kind: "text", required: false };
}

export function addSchemaField(schema, selectedTypeId, field) {
  const type = getSelectedSchemaType(schema, selectedTypeId);
  if (!type) return null;
  type.fields.push(field);
  return field;
}

export function removeSchemaField(schema, selectedTypeId, fieldKey) {
  const type = getSelectedSchemaType(schema, selectedTypeId);
  if (!type || fieldKey === "titre") return null;
  type.fields = type.fields.filter((field) => field.key !== fieldKey);
  return type.fields[0]?.key || "";
}

export function fieldKindLabel(kind) {
  return {
    text: "Texte court",
    textarea: "Texte long",
    number: "Nombre",
    boolean: "Oui / non",
    select: "Liste de valeurs",
    reference: "Référence"
  }[kind] || kind;
}

export function safeSchemaId(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function bumpPatchVersion(version) {
  const parts = String(version || MODEL_SCHEMA_VERSION).split(".").map((part) => Number(part) || 0);
  return `${parts[0] || 1}.${parts[1] || 0}.${(parts[2] || 0) + 1}`;
}

export function mergeModelSchemas(baseSchema, incomingSchema) {
  const base = normalizeModelSchema(baseSchema);
  const incoming = normalizeModelSchema(incomingSchema);
  const types = base.types.map((type) => ({ ...type, fields: [...(type.fields || [])] }));
  const typeMap = new Map(types.map((type) => [type.id, type]));
  for (const incomingType of incoming.types) {
    const existing = typeMap.get(incomingType.id);
    if (!existing) {
      const copy = { ...incomingType, fields: [...(incomingType.fields || [])] };
      typeMap.set(copy.id, copy);
      types.push(copy);
      continue;
    }
    const existingFieldKeys = new Set((existing.fields || []).map((field) => field.key));
    for (const field of incomingType.fields || []) {
      if (!existingFieldKeys.has(field.key)) existing.fields.push(field);
    }
  }
  return {
    version: base.version || incoming.version || MODEL_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    relations: {
      ...(base.relations || {}),
      ...(incoming.relations || {})
    },
    types
  };
}
