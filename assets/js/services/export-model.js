const ENTITY_EXPORT_META_OMIT_KEYS = ["body", "rawText", "path", "size", "color", "x", "y", "z", "vx", "vy", "vz", "index"];
const IMAGE_EXTENSION_BY_MIME = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg"
};

export function serializeEntity(entity, dumpYaml) {
  const meta = { ...entity };
  for (const key of ENTITY_EXPORT_META_OMIT_KEYS) delete meta[key];
  return `---\n${dumpYaml(meta, { lineWidth: 100 })}---\n\n${entity.body || ""}`;
}

export function getExportFiles({ files, entities, modelSchema }) {
  const entityByPath = new Map([...entities.values()].map((entity) => [entity.path, entity]));
  const usedPaths = new Set();
  return [...files.values()]
    .filter((file) => file.path !== "manifest.json")
    .map((file) => {
      const entity = entityByPath.get(file.path);
      const type = entity ? modelSchema.types.find((item) => item.id === entity.type) : null;
      const parts = file.path.split("/");
      let exportPath = file.path;
      if (type?.folder && parts.length) {
        parts[0] = type.folder;
        exportPath = parts.join("/");
      }
      if (usedPaths.has(exportPath)) {
        const extensionIndex = exportPath.lastIndexOf(".");
        const base = extensionIndex > -1 ? exportPath.slice(0, extensionIndex) : exportPath;
        const extension = extensionIndex > -1 ? exportPath.slice(extensionIndex) : "";
        let suffix = 2;
        while (usedPaths.has(`${base}-${suffix}${extension}`)) suffix += 1;
        exportPath = `${base}-${suffix}${extension}`;
      }
      usedPaths.add(exportPath);
      return { ...file, exportPath };
    });
}

export function getFileExtension(path) {
  return String(path || "").split(".").pop().toLowerCase();
}

export function getImageExtensionFromBlob(blob, assetExtensions) {
  const extension = getFileExtension(blob?.name);
  if (assetExtensions.has(extension)) return extension;
  return IMAGE_EXTENSION_BY_MIME[blob?.type] || "png";
}

export function updateMarkdownFileFromEntity(file, entity, { parseMarkdownFile, normalizeSummaryStyle, dumpYaml }) {
  if (!file) return "";
  const parsed = parseMarkdownFile(file.text);
  if ("titre" in parsed.meta) parsed.meta.titre = entity.label;
  else parsed.meta.label = entity.label;
  if (entity.summary_enabled && entity.summary) {
    if ("resume" in parsed.meta || !("summary" in parsed.meta)) parsed.meta.resume = entity.summary;
    else parsed.meta.summary = entity.summary;
    parsed.meta.summary_enabled = true;
    const summaryStyle = normalizeSummaryStyle(entity.summary_style);
    if (summaryStyle === "focus") delete parsed.meta.summary_style;
    else parsed.meta.summary_style = summaryStyle;
  } else {
    delete parsed.meta.resume;
    delete parsed.meta.summary;
    delete parsed.meta.summary_enabled;
    delete parsed.meta.summary_style;
  }
  if (entity.content_format === "html") parsed.meta.content_format = "html";
  else delete parsed.meta.content_format;
  if (entity.graph_image_enabled && entity.graph_image) {
    parsed.meta.graph_image_enabled = true;
    parsed.meta.graph_image = entity.graph_image;
  } else {
    delete parsed.meta.graph_image_enabled;
    delete parsed.meta.graph_image;
  }
  const yaml = dumpYaml(parsed.meta, { lineWidth: 100 });
  file.text = `---\n${yaml}---\n\n${entity.body || ""}`;
  return file.text;
}
