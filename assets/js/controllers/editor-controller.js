export const EDITOR_MODES = Object.freeze(["visual", "markdown", "html", "preview"]);
export const EDITOR_FORMATS = Object.freeze(["markdown", "html"]);

export function normalizeEditorMode(mode) {
  return EDITOR_MODES.includes(mode) ? mode : "visual";
}

export function normalizeEditorFormat(format) {
  return EDITOR_FORMATS.includes(format) ? format : "markdown";
}

export function getInitialEditorMode(entity, looksLikeHtml = () => false) {
  return entity?.content_format === "html" || looksLikeHtml(entity?.body) ? "html" : "visual";
}

export function getEntityEditorFormat(entity, looksLikeHtml = () => false) {
  return entity?.content_format === "html" || looksLikeHtml(entity?.body) ? "html" : "markdown";
}

export function getNextEditorState({ mode, current, toHtml, toMarkdown } = {}) {
  const targetMode = normalizeEditorMode(mode);
  const currentState = {
    body: current?.body || "",
    format: normalizeEditorFormat(current?.format)
  };
  const nextFormat = targetMode === "html"
    ? "html"
    : targetMode === "preview"
      ? currentState.format
      : "markdown";
  const nextBody = nextFormat === currentState.format
    ? currentState.body
    : nextFormat === "html"
      ? toHtml?.(currentState.body) ?? currentState.body
      : toMarkdown?.(currentState.body) ?? currentState.body;
  return { mode: targetMode, body: nextBody, format: nextFormat };
}

export function getEntityEditSignature(entity = {}) {
  return [
    entity.label,
    entity.summary,
    entity.summary_enabled,
    entity.summary_style,
    entity.content_format,
    entity.graph_image,
    entity.graph_image_enabled,
    entity.body
  ].join("\u001f");
}
