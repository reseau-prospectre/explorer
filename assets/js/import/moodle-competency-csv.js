const MOODLE_COMPETENCY_HEADERS = Object.freeze([
  "Parent ID number",
  "ID number",
  "Short name",
  "Description",
  "Description format",
  "Scale values",
  "Scale configuration",
  "Rule type (optional)",
  "Rule outcome (optional)",
  "Rule config (optional)",
  "Cross-referenced competency ID numbers",
  "Exported ID (optional)",
  "Is framework",
  "Taxonomy"
]);

const STANDARD_HEADER_LINE = MOODLE_COMPETENCY_HEADERS.map((header) => `"${header}"`).join(",");
const TAXONOMY_LABELS = Object.freeze({
  competency: ["Compétences", "Compétence"],
  domain: ["Domaines", "Domaine"],
  behaviour: ["Comportements", "Comportement"],
  behavior: ["Comportements", "Comportement"],
  indicator: ["Indicateurs", "Indicateur"],
  outcome: ["Résultats", "Résultat"],
  level: ["Niveaux", "Niveau"],
  concept: ["Concepts", "Concept"],
  value: ["Valeurs", "Valeur"],
  practice: ["Pratiques", "Pratique"],
  skill: ["Savoir-faire", "Savoir-faire"],
  proficiency: ["Maîtrises", "Maîtrise"]
});
const TYPE_COLORS = Object.freeze(["#17365d", "#2f75b5", "#6fb85f", "#9b6be8", "#e0a336", "#0f6b78", "#e5534b"]);

export function isLikelyMoodleCompetencyCsv(text = "") {
  const firstLine = String(text).replace(/^\uFEFF/, "").split(/\r?\n/, 1)[0] || "";
  const normalized = firstLine.toLowerCase();
  return MOODLE_COMPETENCY_HEADERS.every((header) => normalized.includes(header.toLowerCase()));
}

export function convertMoodleCompetencyCsv(text, options = {}) {
  const Papa = options.Papa || globalThis.Papa;
  if (!Papa?.parse) throw new Error("PapaParse est requis pour lire les CSV Moodle.");

  const csvText = replaceFirstLine(String(text || "").replace(/^\uFEFF/, ""), STANDARD_HEADER_LINE);
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: "greedy"
  });
  if (parsed.errors?.some((error) => error.type === "Quotes")) {
    throw new Error("CSV Moodle invalide : guillemets ou champs multilignes incorrects.");
  }

  const rows = parsed.data
    .map(normalizeRow)
    .filter((row) => row["ID number"] && row["Short name"]);
  validateMoodleRows(rows);

  const framework = rows.find((row) => row["Is framework"] === "1");
  const frameworkSlug = slugify(framework["ID number"] || framework["Short name"] || options.fileName || "referentiel");
  const namespaceSlug = `${frameworkSlug}${options.namespaceSuffix || ""}`;
  const taxonomy = parseTaxonomy(framework.Taxonomy);
  const nodeMap = new Map(rows.map((row) => [row["ID number"], row]));
  const idMap = new Map(rows.map((row) => [row["ID number"], prospectreId(namespaceSlug, row["ID number"])]));
  const model = createModelSchema(taxonomy);
  const files = [];
  const entityFiles = [];

  for (const row of rows) {
    const isFramework = row["Is framework"] === "1";
    const depth = isFramework ? 0 : getDepth(row, nodeMap);
    const type = isFramework ? "framework" : typeForDepth(taxonomy, depth);
    const parentMoodleId = getParentMoodleId(row, framework);
    const entity = rowToEntity(row, {
      id: idMap.get(row["ID number"]),
      parentId: parentMoodleId ? idMap.get(parentMoodleId) : "",
      type,
      isFramework,
      idMap,
      namespaceSlug
    });
    const path = `${folderForType(model, type)}/${slugify(row["ID number"] || row["Short name"])}.md`;
    const file = {
      path,
      text: serializeMarkdown(entity.meta, entity.body)
    };
    entityFiles.push(file);
  }

  files.push({
    path: "README.md",
    text: createReadme(framework, rows, taxonomy)
  });
  files.push(...entityFiles);

  const manifest = {
    id: `pack:moodle-${namespaceSlug}`,
    titre: `${cleanTitle(framework["Short name"])} - Référentiel Moodle`,
    version: "1.0.0",
    format_version: "1.0.0",
    date_generation: new Date().toISOString().slice(0, 10),
    source: {
      type: "moodle-competency-framework-csv",
      fileName: options.fileName || "",
      frameworkId: framework["ID number"],
      taxonomy
    },
    modele: model,
    fichiers: ["README.md", ...entityFiles.map((file) => file.path), "manifest.json"]
  };

  files.push({
    path: "manifest.json",
    text: JSON.stringify(manifest, null, 2)
  });

  return {
    manifest,
    files,
    stats: {
      rows: rows.length,
      frameworkId: framework["ID number"],
      taxonomy
    }
  };
}

function replaceFirstLine(text, newFirstLine) {
  const lines = text.split(/\r?\n/);
  lines[0] = newFirstLine;
  return lines.join("\n");
}

function normalizeRow(row) {
  return Object.fromEntries(MOODLE_COMPETENCY_HEADERS.map((header) => [
    header,
    String(row?.[header] ?? "").trim()
  ]));
}

function validateMoodleRows(rows) {
  if (!rows.length) throw new Error("CSV Moodle vide.");
  const frameworks = rows.filter((row) => row["Is framework"] === "1");
  if (frameworks.length !== 1) {
    throw new Error("CSV Moodle invalide : une seule ligne référentiel est attendue.");
  }
  const framework = frameworks[0];
  if (!framework.Taxonomy || !parseTaxonomy(framework.Taxonomy).length) {
    throw new Error("CSV Moodle invalide : taxonomie absente sur la ligne référentiel.");
  }
  const ids = new Set();
  for (const row of rows) {
    if (ids.has(row["ID number"])) throw new Error(`CSV Moodle invalide : identifiant duplique ${row["ID number"]}.`);
    ids.add(row["ID number"]);
  }
}

function parseTaxonomy(value) {
  return String(value || "")
    .split(",")
    .map((item) => normalizeTypeId(item))
    .filter(Boolean);
}

function normalizeTypeId(value) {
  return slugify(value).replace(/-/g, "_");
}

function getDepth(row, nodeMap, stack = new Set()) {
  const parentId = row["Parent ID number"];
  if (!parentId || !nodeMap.has(parentId) || stack.has(parentId)) return 1;
  const parent = nodeMap.get(parentId);
  if (parent["Is framework"] === "1") return 1;
  stack.add(parentId);
  return getDepth(parent, nodeMap, stack) + 1;
}

function getParentMoodleId(row, framework) {
  if (row["Is framework"] === "1") return "";
  return row["Parent ID number"] || framework["ID number"];
}

function typeForDepth(taxonomy, depth) {
  return taxonomy[Math.max(0, depth - 1)] || "competency";
}

function createModelSchema(taxonomy) {
  const seen = new Set(["framework"]);
  const types = [{
    id: "framework",
    label: "Référentiels",
    singular: "Référentiel",
    folder: "referentiels",
    color: TYPE_COLORS[0],
    size: 27,
    order: 0,
    showLabel: true,
    fields: commonFields()
  }];

  taxonomy.forEach((rawType, index) => {
    let id = rawType || "competency";
    if (seen.has(id)) id = `${id}_${index + 1}`;
    seen.add(id);
    const labels = TAXONOMY_LABELS[rawType] || [humanizeType(rawType), humanizeType(rawType).replace(/s$/, "")];
    types.push({
      id,
      label: labels[0],
      singular: labels[1],
      folder: `${id.replace(/_/g, "-")}s`,
      color: TYPE_COLORS[(index + 1) % TYPE_COLORS.length],
      size: Math.max(8, 22 - index * 3),
      order: index + 1,
      showLabel: index < 2,
      fields: commonFields()
    });
  });

  return {
    version: "1.0.0",
    updatedAt: new Date().toISOString(),
    relations: {
      parent: { label: "Parent" },
      child: { label: "Enfant" },
      cross_reference: { label: "Référence croisée" },
      related_to: { label: "Relie" }
    },
    types
  };
}

function commonFields() {
  return [
    { key: "titre", label: "Titre", kind: "text", required: true },
    { key: "resume", label: "Resume", kind: "textarea", required: false },
    { key: "parent", label: "Parent", kind: "reference", target: "*", multiple: false, required: false },
    { key: "relations", label: "Relations", kind: "reference", target: "*", multiple: true, required: false },
    { key: "moodle_id", label: "ID Moodle", kind: "text", required: false }
  ];
}

function rowToEntity(row, context) {
  const cleanDescription = sanitizeDescription(row.Description);
  const isHtmlContent = hasHtmlMarkup(cleanDescription) || row["Description format"] === "1";
  const relations = [];
  if (context.parentId) relations.push({ target: context.parentId, type: "parent" });
  for (const ref of parseCrossReferences(row["Cross-referenced competency ID numbers"])) {
    const target = context.idMap.get(ref);
    if (target) relations.push({ target, type: "cross_reference" });
  }

  const meta = stripEmpty({
    id: context.id,
    type: context.type,
    titre: cleanTitle(row["Short name"]),
    statut: "officiel",
    parent: context.parentId,
    relations,
    moodle_id: row["ID number"],
    moodle_parent_id: row["Parent ID number"],
    moodle_exported_id: row["Exported ID (optional)"],
    moodle_description_format: row["Description format"],
    moodle_scale_values: row["Scale values"],
    moodle_scale_configuration: row["Scale configuration"],
    moodle_rule_type: row["Rule type (optional)"],
    moodle_rule_outcome: row["Rule outcome (optional)"],
    moodle_rule_config: row["Rule config (optional)"],
    moodle_taxonomy: row.Taxonomy,
    moodle_is_framework: context.isFramework || undefined,
    content_format: isHtmlContent ? "html" : "markdown"
  });
  const body = createBody(meta.titre, cleanDescription, meta.content_format);
  return { meta, body };
}

function stripEmpty(object) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== "" && value !== null && value !== undefined;
  }));
}

function createBody(title, description, format = "markdown") {
  const content = normalizeRichContent(description);
  if (format === "html") {
    return [`<h1>${escapeHtml(title)}</h1>`, content].filter(Boolean).join("\n\n").trim() + "\n";
  }
  const parts = [`# ${title}`];
  if (content) parts.push("", content);
  return parts.join("\n").trim() + "\n";
}

function sanitizeDescription(value) {
  const html = String(value || "").trim();
  if (!html) return "";
  if (globalThis.DOMPurify?.sanitize) {
    return globalThis.DOMPurify.sanitize(html, {
      ADD_ATTR: ["class", "style", "target", "rel", "loading", "decoding"],
      FORBID_TAGS: ["script", "style", "object", "embed"]
    }).trim();
  }
  return html;
}

function normalizeRichContent(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function hasHtmlMarkup(value) {
  return /<[a-z][\s\S]*>/i.test(String(value || ""));
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseCrossReferences(value) {
  return String(value || "")
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function createReadme(framework, rows, taxonomy) {
  const title = cleanTitle(framework["Short name"]);
  return [
    `# ${title}`,
    "",
    "## Structure",
    "",
    `- Ligne référentiel : \`${framework["ID number"]}\``,
    `- Elements Moodle : ${rows.length}`,
    `- Taxonomie : ${taxonomy.join(", ")}`
  ].join("\n");
}

function serializeMarkdown(meta, body) {
  const yaml = globalThis.jsyaml?.dump
    ? globalThis.jsyaml.dump(meta, { lineWidth: 100 })
    : fallbackYaml(meta);
  return `---\n${yaml}---\n\n${body}`;
}

function fallbackYaml(meta) {
  return Object.entries(meta).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join("\n") + "\n";
}

function prospectreId(namespaceSlug, moodleId) {
  return `moodle:${namespaceSlug}:${slugify(moodleId)}`;
}

function folderForType(model, type) {
  return model.types.find((item) => item.id === type)?.folder || `${type}s`;
}

function cleanTitle(value) {
  return String(value || "")
    .replace(/^[^\p{L}\p{N}]+/u, "")
    .replace(/\s+/g, " ")
    .trim() || "Référentiel Moodle";
}

function humanizeType(value) {
  return String(value || "competency")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96) || "item";
}
