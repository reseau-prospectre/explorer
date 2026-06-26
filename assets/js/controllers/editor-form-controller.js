import { getRelativePackPath } from "../core/utils.js";
import {
  htmlToMarkdown,
  looksLikeHtml,
  markdownToEditableHtml
} from "../ui/content-format.js";
import {
  applyEditorSyntaxHighlighting,
  createEditFormValues,
  getEditedBodyAndFormatValue,
  normalizeSummaryStyle,
  renderEditFormView,
  resetEditorScrollPositions,
  setGraphImageOptionEnabled,
  setGraphImageValue,
  setSummaryOptionEnabled,
  setSummaryStyleSelection,
  summaryStyleLabel
} from "../ui/editor-view.js?v=20260626-v326-edit-library-hero-1";
import {
  destroyEditorState,
  getEntityEditSignature,
  getEntityEditorFormat,
  getEditorModeViewState,
  getInitialEditorMode,
  getNextEditorState,
  isEditorBodyDirty,
  markEditorSurfaceDirty,
  normalizeEditorFormat,
  normalizeEditorMode,
  scheduleEditorAutosave
} from "./editor-controller.js";

const ENTITY_EDIT_NOTICE_DISMISS_KEY = "prospectre.editNotice.dismissed";
const ENTITY_EDIT_NOTICE_DISMISS_LIMIT = 10;

export function createEditorFormController({
  els,
  state,
  isSummaryOptionEnabled,
  getImageExtensionFromBlob,
  blobToDataUrl,
  resolveEditorMarkdownAssets,
  updateFileFromEntity,
  resolveGraphImage,
  getFirstMarkdownImage,
  rebuildGraph,
  renderRightPanel,
  exportSelected,
  isMoodleHtmlEntity,
  ensureMoodleHtmlSupport,
  renderContentWithEntityLinks,
  decorateSmartLinks,
  bindInlineEntityClicks,
  requestAnimationFrameRef = requestAnimationFrame,
  toastuiRef = () => window.toastui,
  prismRef = () => window.Prism,
  documentRef = document,
  cryptoRef = crypto
}) {
  function renderEditForm(entity) {
    destroyContentEditor();
    const contentFormat = getEntityEditorFormat(entity, looksLikeHtml);
    const editorMode = getInitialEditorMode(entity, looksLikeHtml);
    const summaryEnabled = isSummaryOptionEnabled(entity);
    const summaryStyle = normalizeSummaryStyle(entity.summary_style);
    const graphImageEnabled = Boolean(entity.graph_image_enabled && entity.graph_image);
    const graphImageValue = entity.graph_image || "";
    els.panelContent.innerHTML = renderEditFormView({
      entity,
      contentFormat,
      editorMode,
      summaryEnabled,
      summaryStyle,
      graphImageEnabled,
      graphImageValue,
      showLocalNotice: shouldShowEntityEditNotice()
    });
    els.panelContent.querySelector("[data-dismiss-entity-edit-notice]")?.addEventListener("click", () => {
      incrementEntityEditNoticeDismissCount();
      els.panelContent.querySelector("[data-entity-edit-notice]")?.remove();
    });
    els.panelContent.querySelector("#edit-toggle").addEventListener("change", (event) => {
      if (event.target.checked) return;
      persistEditForm(entity, { exitEdit: true });
    });
    els.panelContent.querySelector("#summary-toggle")?.addEventListener("change", (event) => {
      const enabled = event.target.checked;
      setSummaryOptionEnabled(els.panelContent, enabled);
      markEditDirty();
      scheduleEditAutosave(entity);
    });
    els.panelContent.querySelectorAll("[data-summary-style]").forEach((button) => {
      button.addEventListener("click", () => {
        setSummaryStyleSelection(els.panelContent, button, summaryStyleLabel(button.dataset.summaryStyle));
        markEditDirty();
        scheduleEditAutosave(entity);
      });
    });
    els.panelContent.querySelector("#graph-image-toggle")?.addEventListener("change", (event) => {
      setGraphImageOptionEnabled(els.panelContent, event.target.checked);
      markEditDirty();
      scheduleEditAutosave(entity);
    });
    els.panelContent.querySelector("#graph-image-file")?.addEventListener("change", async (event) => {
      const [file] = event.target.files || [];
      if (!file) return;
      const extension = getImageExtensionFromBlob(file);
      const path = `assets/uploads/${cryptoRef.randomUUID()}.${extension}`;
      state.files.set(path, { path, dataUrl: await blobToDataUrl(file), binary: true });
      const relativePath = getRelativePackPath(entity.path, path);
      setGraphImageValue(els.panelContent, relativePath);
      markEditDirty();
      scheduleEditAutosave(entity);
    });
    els.panelContent.querySelector("#clear-graph-image")?.addEventListener("click", () => {
      setGraphImageValue(els.panelContent, "");
      markEditDirty();
      scheduleEditAutosave(entity);
    });
    els.panelContent.querySelectorAll("[data-editor-mode]").forEach((button) => {
      button.addEventListener("click", () => switchEditorMode(entity, button.dataset.editorMode));
    });
    setupContentEditor(entity);
    const surface = els.panelContent.querySelector(".edit-surface");
    surface?.addEventListener("input", (event) => {
      markEditDirty({ body: event.target?.id === "adjust-body" });
      if (getEditorMode() === "preview" || getEditorFormat() === "html") updateEditorPreview(entity);
      scheduleEditAutosave(entity);
    });
    surface?.addEventListener("change", (event) => {
      if (!event.target?.closest("[data-editor-mode]")) markEditDirty();
      scheduleEditAutosave(entity);
    });
    els.panelContent.querySelector("#download-current").addEventListener("click", exportSelected);
  }

  function markEditDirty(options = {}) {
    markEditorSurfaceDirty(els.panelContent.querySelector(".edit-surface"), options);
  }

  function isBodyEditDirty() {
    return isEditorBodyDirty(els.panelContent.querySelector(".edit-surface"));
  }

  function scheduleEditAutosave(entity) {
    state.editAutosaveTimer = scheduleEditorAutosave(
      state.editAutosaveTimer,
      () => persistEditForm(entity, { rebuild: false, silent: true })
    );
  }

  function readEditFormValues(entity) {
    const summaryEnabledNow = Boolean(els.panelContent.querySelector("#summary-toggle")?.checked);
    const graphImageEnabledNow = Boolean(els.panelContent.querySelector("#graph-image-toggle")?.checked);
    const graphImage = graphImageEnabledNow ? els.panelContent.querySelector("#graph-image-source")?.value.trim() || "" : "";
    const edited = isBodyEditDirty()
      ? getEditedBodyAndFormat()
      : {
        body: entity.body || "",
        format: getEntityEditorFormat(entity)
      };
    return createEditFormValues({
      entity,
      label: els.panelContent.querySelector("#adjust-label")?.value || "",
      summary: els.panelContent.querySelector("#adjust-summary")?.value || "",
      summaryEnabled: summaryEnabledNow,
      summaryStyle: els.panelContent.querySelector("[data-summary-style].active")?.dataset.summaryStyle,
      graphImageEnabled: graphImageEnabledNow,
      graphImage,
      edited
    });
  }

  function persistEditForm(entity, options = {}) {
    if (!entity || !els.panelContent.querySelector(".edit-surface")) return false;
    clearTimeout(state.editAutosaveTimer);
    const previousSignature = getEntityEditSignature(entity);
    Object.assign(entity, readEditFormValues(entity));
    const nextSignature = getEntityEditSignature(entity);
    if (previousSignature !== nextSignature) {
      updateFileFromEntity(entity);
      entity.imageURL = entity.graph_image_enabled
        ? resolveGraphImage(entity.graph_image, entity.path)
        : getFirstMarkdownImage(entity.body, entity.path);
      if (options.rebuild !== false) rebuildGraph();
    }
    if (options.exitEdit) {
      state.editMode = false;
      renderRightPanel();
    }
    return previousSignature !== nextSignature;
  }

  function switchEditorMode(entity, mode) {
    const current = isBodyEditDirty()
      ? getEditedBodyAndFormat()
      : {
        body: entity.body || "",
        format: getEntityEditorFormat(entity, looksLikeHtml)
      };
    destroyContentEditor();
    const next = getNextEditorState({
      mode,
      current,
      toHtml: markdownToEditableHtml,
      toMarkdown: htmlToMarkdown
    });
    setEditorMode(next.mode, next.format);
    const fallback = els.panelContent.querySelector("#adjust-body");
    if (fallback) {
      fallback.value = next.body;
      fallback.scrollTop = 0;
      fallback.scrollLeft = 0;
    }
    setupContentEditor(entity);
    resetEditorScroll();
  }

  function setupContentEditor(entity) {
    const mode = getEditorMode();
    const format = getEditorFormat();
    const mount = els.panelContent.querySelector("#content-editor");
    const fallback = els.panelContent.querySelector("#adjust-body");
    const initialBody = fallback?.value ?? entity.body ?? "";
    const previewShell = els.panelContent.querySelector(".html-preview-shell");
    mount?.classList.add("hidden");
    fallback?.classList.add("content-editor-fallback");
    fallback.hidden = true;
    previewShell?.classList.add("hidden");
    if (mode === "preview") {
      state.contentEditorAssetMap = new Map();
      previewShell?.classList.remove("hidden");
      updateEditorPreview(entity);
      resetEditorScroll();
      return;
    }
    if (mode === "html" || mode === "markdown") {
      fallback?.classList.remove("content-editor-fallback");
      fallback.hidden = false;
      state.contentEditorAssetMap = new Map();
      resetEditorScroll();
      return;
    }
    const toastui = toastuiRef();
    if (!mount || !toastui?.Editor) {
      mount?.classList.add("hidden");
      fallback?.classList.remove("content-editor-fallback");
      fallback?.classList.remove("hidden");
      fallback.hidden = false;
      return;
    }
    mount.classList.remove("hidden");
    fallback.classList.remove("hidden");
    fallback.classList.add("content-editor-fallback");
    fallback.hidden = true;
    state.contentEditorAssetMap = new Map();
    const editorMarkdown = resolveEditorMarkdownAssets(format === "html" ? htmlToMarkdown(initialBody) : initialBody, entity.path);
    state.contentEditor = new toastui.Editor({
      el: mount,
      height: "520px",
      theme: documentRef.documentElement.dataset.theme === "light" ? undefined : "dark",
      initialEditType: "wysiwyg",
      previewStyle: "vertical",
      initialValue: editorMarkdown,
      language: "fr-FR",
      usageStatistics: false,
      hideModeSwitch: true,
      toolbarItems: [
        ["heading", "bold", "italic", "strike"],
        ["hr", "quote"],
        ["ul", "ol", "task", "table"],
        ["link", "image"],
        ["code", "codeblock"]
      ],
      hooks: {
        addImageBlobHook: async (blob, callback) => {
          const extension = getImageExtensionFromBlob(blob);
          const path = `assets/uploads/${cryptoRef.randomUUID()}.${extension}`;
          const dataUrl = await blobToDataUrl(blob);
          state.files.set(path, { path, dataUrl, binary: true });
          const relativePath = getRelativePackPath(entity.path, path);
          state.contentEditorAssetMap.set(dataUrl, relativePath);
          callback(dataUrl, blob.name || "Image");
        }
      }
    });
    state.contentEditor.on?.("change", () => {
      markEditDirty({ body: true });
      scheduleEditAutosave(entity);
    });
    resetEditorScroll();
  }

  function updateEditorPreview(entity) {
    const preview = els.panelContent.querySelector("#html-preview");
    if (!preview) return;
    const edited = getEditedBodyAndFormat();
    if (isMoodleHtmlEntity(entity) || edited.format === "html") ensureMoodleHtmlSupport();
    preview.innerHTML = renderContentWithEntityLinks(edited.body, entity.path, edited.format);
    decorateSmartLinks(preview);
    applySyntaxHighlighting(preview);
    bindInlineEntityClicks();
  }

  function applySyntaxHighlighting(root = els.panelContent) {
    applyEditorSyntaxHighlighting(root, prismRef());
  }

  function getEditedBodyAndFormat() {
    const mode = getEditorMode();
    const format = getEditorFormat();
    const fallbackBody = els.panelContent.querySelector("#adjust-body")?.value ?? "";
    return getEditedBodyAndFormatValue({
      mode,
      format,
      visualBody: state.contentEditor?.getMarkdown() ?? fallbackBody,
      fallbackBody,
      assetMap: state.contentEditorAssetMap
    });
  }

  function getEditorMode() {
    return normalizeEditorMode(els.panelContent.querySelector("#editor-mode")?.value);
  }

  function getEditorFormat() {
    return normalizeEditorFormat(els.panelContent.querySelector("#editor-format")?.value);
  }

  function setEditorMode(mode, format) {
    const viewState = getEditorModeViewState(mode, format);
    const modeInput = els.panelContent.querySelector("#editor-mode");
    const formatInput = els.panelContent.querySelector("#editor-format");
    const card = els.panelContent.querySelector(".edit-editor-card");
    const badge = els.panelContent.querySelector(".editor-format-badge");
    if (modeInput) modeInput.value = viewState.mode;
    if (formatInput) formatInput.value = viewState.format;
    card?.classList.remove("is-visual-mode", "is-markdown-mode", "is-html-mode", "is-preview-mode");
    card?.classList.add(viewState.modeClass);
    card?.setAttribute("data-editor-format", viewState.format);
    if (badge) badge.textContent = viewState.formatBadge;
    els.panelContent.querySelectorAll("[data-editor-mode]").forEach((button) => {
      const active = button.dataset.editorMode === viewState.mode;
      button.classList.toggle("active", active);
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function resetEditorScroll() {
    resetEditorScrollPositions(els.panelContent, requestAnimationFrameRef);
  }

  function destroyContentEditor() {
    Object.assign(state, destroyEditorState(state.contentEditor));
  }

  return {
    renderEditForm,
    markEditDirty,
    isBodyEditDirty,
    scheduleEditAutosave,
    readEditFormValues,
    persistEditForm,
    switchEditorMode,
    setupContentEditor,
    updateEditorPreview,
    applySyntaxHighlighting,
    getEditedBodyAndFormat,
    getEditorMode,
    getEditorFormat,
    setEditorMode,
    resetEditorScroll,
    destroyContentEditor
  };
}

function shouldShowEntityEditNotice() {
  return getEntityEditNoticeDismissCount() < ENTITY_EDIT_NOTICE_DISMISS_LIMIT;
}

function getEntityEditNoticeDismissCount() {
  try {
    return Math.max(0, Number(localStorage.getItem(ENTITY_EDIT_NOTICE_DISMISS_KEY) || 0) || 0);
  } catch {
    return 0;
  }
}

function incrementEntityEditNoticeDismissCount() {
  try {
    localStorage.setItem(ENTITY_EDIT_NOTICE_DISMISS_KEY, String(getEntityEditNoticeDismissCount() + 1));
  } catch {
    // Non-critical preference.
  }
}
