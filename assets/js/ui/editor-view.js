import { escapeHtml } from "../core/utils.js";

export function normalizeSummaryStyle(style) {
  return ["focus", "note", "typing"].includes(style) ? style : "focus";
}

export function summaryStyleLabel(style) {
  return {
    focus: "Signal",
    note: "Note",
    typing: "Typing"
  }[normalizeSummaryStyle(style)];
}

export function renderSummaryCallout(entity, summary) {
  const style = normalizeSummaryStyle(entity?.summary_style);
  const length = Math.max(24, Math.min(220, summary.length));
  return `
    <aside class="entity-summary-card entity-summary-card--${style}" style="--summary-characters:${length}" aria-label="Résumé">
      <div class="entity-summary-card__head">
        <i>${style === "typing" ? "auto_awesome" : "notes"}</i>
        <span>Résumé</span>
      </div>
      <p>${escapeHtml(summary)}</p>
    </aside>
  `;
}

export function renderSummaryStyleChoice(style, activeStyle) {
  const active = normalizeSummaryStyle(activeStyle) === style;
  const icon = style === "typing" ? "auto_awesome" : style === "note" ? "sticky_note_2" : "format_quote";
  return `
    <button type="button" class="summary-style-preview ${active ? "active" : ""}" data-summary-style="${style}" aria-checked="${active}">
      <span class="summary-style-preview__label"><i>${icon}</i>${escapeHtml(summaryStyleLabel(style))}</span>
      <span class="summary-style-preview__card entity-summary-card entity-summary-card--${style}" aria-hidden="true">
        <span class="entity-summary-card__head"><i>${icon}</i><span>Résumé</span></span>
        <span class="summary-style-preview__line">Idée clé de la fiche, prête à être parcourue.</span>
      </span>
    </button>
  `;
}

export function renderEditorModeButton(mode, activeMode, icon, label) {
  const active = mode === activeMode;
  const classes = ["ps-tab", active ? "active is-active" : ""].filter(Boolean).join(" ");
  return `
    <button type="button" class="${classes}" data-editor-mode="${mode}" aria-pressed="${active}" aria-label="${escapeHtml(label)}">
      <i>${icon}</i><span>${escapeHtml(label)}</span>
    </button>
  `;
}

export function renderEditFormView({
  entity,
  contentFormat,
  editorMode,
  summaryEnabled,
  summaryStyle,
  graphImageEnabled,
  graphImageValue,
  showLocalNotice = true
}) {
  return `
    <section class="edit-surface" data-edit-dirty="false" data-body-dirty="false">
      <header class="edit-surface-head entity-edit-head">
        <div class="edit-surface-head__row">
          <div class="edit-surface-title">
            <h2>${escapeHtml(entity.label || "Fiche")}</h2>
          </div>
          <label class="edit-toggle">
            <i>edit</i>
            <span>Modifier</span>
            <span class="ps-switch" aria-label="Quitter le mode édition">
              <input id="edit-toggle" type="checkbox" checked>
              <span class="ps-switch__track" aria-hidden="true"><span class="ps-switch__thumb"></span></span>
            </span>
          </label>
        </div>
        ${showLocalNotice ? `<div class="local-edit-warning local-edit-warning--dismissable ps-chip" data-entity-edit-notice><i>info</i><span>Les changements sont enregistrés localement ici, puis exportables comme nouveau pack.</span><button class="ps-icon-button" type="button" data-dismiss-entity-edit-notice aria-label="Masquer ce rappel"><i>close</i></button></div>` : ""}
      </header>
      <div class="edit-card ps-card ps-surface">
        <label class="field-label ps-field ps-text-label">Titre
          <input id="adjust-label" class="text-field ps-input" type="text" value="${escapeHtml(entity.label)}">
        </label>
      </div>
      <section class="edit-card edit-option-card ps-card ps-surface ${summaryEnabled ? "is-enabled" : ""}" data-edit-option="summary">
        <div class="edit-card-head">
          <div>
            <h3>Résumé</h3>
            <p>Afficher un résumé distinct du contenu principal.</p>
          </div>
          <label class="ps-switch" aria-label="Activer le résumé">
            <input id="summary-toggle" type="checkbox"${summaryEnabled ? " checked" : ""}>
            <span class="ps-switch__track" aria-hidden="true"><span class="ps-switch__thumb"></span></span>
          </label>
        </div>
        <textarea id="adjust-summary" class="ps-input" rows="4"${summaryEnabled ? "" : " disabled"}>${escapeHtml(entity.summary || "")}</textarea>
        <details class="summary-appearance" ${summaryEnabled ? "" : "hidden"}>
          <summary><i>palette</i><span>Apparence du résumé</span><strong>${escapeHtml(summaryStyleLabel(summaryStyle))}</strong></summary>
          <div class="summary-style-preview-grid" role="radiogroup" aria-label="Style du résumé">
            ${renderSummaryStyleChoice("focus", summaryStyle)}
            ${renderSummaryStyleChoice("note", summaryStyle)}
            ${renderSummaryStyleChoice("typing", summaryStyle)}
          </div>
        </details>
      </section>
      <section class="edit-card edit-editor-card ps-editor-shell ps-surface is-${editorMode}-mode" data-editor-format="${contentFormat}">
        <header class="edit-editor-head ps-card__header">
          <div>
            <h3 class="ps-card__title">Contenu</h3>
          </div>
          <span class="editor-format-badge ps-chip">${contentFormat === "html" ? "HTML" : "Markdown"}</span>
        </header>
        <input id="content-format" type="hidden" value="${contentFormat}">
        <input id="editor-format" type="hidden" value="${contentFormat}">
        <input id="editor-mode" type="hidden" value="${editorMode}">
        <div class="editor-mode-bar ps-tab-list" role="toolbar" aria-label="Vues d’édition du contenu">
          ${renderEditorModeButton("visual", editorMode, "stylus_note", "Visuel")}
          ${renderEditorModeButton("markdown", editorMode, "notes", "Markdown")}
          ${renderEditorModeButton("html", editorMode, "code_blocks", "HTML")}
          ${renderEditorModeButton("preview", editorMode, "visibility", "Aperçu")}
        </div>
        <div class="editor-workbench ps-editor-surface">
          <div id="content-editor" class="content-editor ps-editor-surface"></div>
          <textarea id="adjust-body" class="content-editor-fallback ps-input" rows="18" spellcheck="false">${escapeHtml(entity.body || "")}</textarea>
          <div class="html-preview-shell hidden">
            <div id="html-preview" class="html-editor-preview" aria-live="polite"></div>
          </div>
        </div>
      </section>
      <section class="edit-card edit-option-card ps-card ps-surface ${graphImageEnabled ? "is-enabled" : ""}" data-edit-option="graph-image">
        <div class="edit-card-head">
          <div>
            <p class="kicker">Graphe</p>
            <h3>Image du nœud</h3>
            <p>Utiliser une image comme texture du nœud sélectionné.</p>
          </div>
          <label class="ps-switch" aria-label="Activer l’image du graphe">
            <input id="graph-image-toggle" type="checkbox"${graphImageEnabled ? " checked" : ""}>
            <span class="ps-switch__track" aria-hidden="true"><span class="ps-switch__thumb"></span></span>
          </label>
        </div>
        <div class="graph-image-editor ${graphImageEnabled ? "" : "hidden"}">
          <label class="field-label">URL ou chemin d’asset
            <input id="graph-image-source" class="text-field" type="text" value="${escapeHtml(graphImageValue)}" placeholder="https://… ou assets/uploads/image.png">
          </label>
          <div class="graph-image-actions">
            <label class="secondary-button compact-action">
              <i>add_photo_alternate</i><span>Ajouter une image</span>
              <input id="graph-image-file" type="file" accept=".png,.jpg,.jpeg,.gif,.webp,.svg,image/*">
            </label>
            <button id="clear-graph-image" class="ghost-button" type="button"><i>backspace</i><span>Vider</span></button>
          </div>
        </div>
      </section>
      <footer class="edit-actions edit-actions--download">
        <button id="download-current" class="ps-button edit-download-card" type="button">
          <i>download</i>
          <span>Télécharger la fiche Markdown</span>
        </button>
      </footer>
    </section>
  `;
}

export function getEditedBodyAndFormatValue({ mode, format, visualBody = "", fallbackBody = "", assetMap = new Map() }) {
  let body = mode === "visual" ? visualBody : fallbackBody;
  for (const [resolved, original] of assetMap) {
    body = body.split(resolved).join(original);
  }
  return { body, format };
}

export function createEditFormValues({
  entity,
  label,
  summary,
  summaryEnabled,
  summaryStyle,
  graphImageEnabled,
  graphImage,
  edited
}) {
  return {
    label: label.trim() || entity.label,
    summary: summaryEnabled ? summary.trim() || "" : "",
    summary_enabled: summaryEnabled,
    summary_style: summaryEnabled ? normalizeSummaryStyle(summaryStyle) : "",
    content_format: edited.format,
    graph_image: graphImage,
    graph_image_enabled: Boolean(graphImageEnabled && graphImage),
    body: edited.body
  };
}

export function applyEditorSyntaxHighlighting(root, prism) {
  if (!root || !prism?.highlightAllUnder) return;
  root.querySelectorAll("pre").forEach((block) => {
    block.classList.add("line-numbers");
    const code = block.querySelector("code");
    if (code && ![...code.classList].some((className) => className.startsWith("language-"))) {
      code.classList.add("language-markdown");
    }
  });
  prism.highlightAllUnder(root);
}

export function resetEditorScrollPositions(root, scheduleFrame = requestAnimationFrame) {
  const reset = () => {
    [
      "#adjust-body",
      "#html-preview",
      ".toastui-editor-contents",
      ".toastui-editor-md-container",
      ".toastui-editor-ww-container",
      ".toastui-editor-main",
      ".editor-workbench"
    ].forEach((selector) => {
      const node = root?.querySelector(selector);
      if (!node) return;
      node.scrollTop = 0;
      node.scrollLeft = 0;
    });
  };
  reset();
  scheduleFrame(() => {
    reset();
    setTimeout(reset, 60);
  });
}

export function setSummaryOptionEnabled(root, enabled) {
  const summary = root?.querySelector("#adjust-summary");
  root?.querySelector("[data-edit-option='summary']")?.classList.toggle("is-enabled", enabled);
  root?.querySelector(".summary-appearance")?.toggleAttribute("hidden", !enabled);
  if (!summary) return;
  summary.disabled = !enabled;
  if (enabled) summary.focus();
}

export function setSummaryStyleSelection(root, selectedButton, label) {
  root?.querySelectorAll("[data-summary-style]").forEach((item) => {
    const active = item === selectedButton;
    item.classList.toggle("active", active);
    item.setAttribute("aria-checked", String(active));
  });
  const output = root?.querySelector(".summary-appearance summary strong");
  if (output) output.textContent = label;
}

export function setGraphImageOptionEnabled(root, enabled) {
  root?.querySelector("[data-edit-option='graph-image']")?.classList.toggle("is-enabled", enabled);
  root?.querySelector(".graph-image-editor")?.classList.toggle("hidden", !enabled);
  if (enabled) root?.querySelector("#graph-image-source")?.focus();
}

export function setGraphImageValue(root, value) {
  const source = root?.querySelector("#graph-image-source");
  const toggle = root?.querySelector("#graph-image-toggle");
  if (source) source.value = value || "";
  if (toggle) toggle.checked = Boolean(value);
  setGraphImageOptionEnabled(root, Boolean(value));
}
