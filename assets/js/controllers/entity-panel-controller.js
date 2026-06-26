import { getId } from "../core/utils.js";
import { formatManifestDate } from "../ui/insight-model.js";
import {
  getEntityRenderFormat,
  getVisibleEntitySummary,
  renderEntityReadView,
  renderInlineRelations
} from "../ui/entity-view.js?v=20260626-v324-library-reperes-1";
import { renderSummaryCallout } from "../ui/editor-view.js?v=20260626-v326-edit-library-hero-1";
import {
  getManifestCover,
  renderOverviewDetailsView,
  renderOverviewEditView,
  setOverviewCoverOptionEnabled,
  setOverviewCoverValue
} from "../ui/overview-view.js?v=20260626-v326-edit-library-hero-1";
import { renderPanelSkeleton } from "../ui/panel-skeletons.js?v=20260626-v315-granular-skeletons-1";
import { bindDiscussionPanel } from "./discussion-panel-controller.js";

const OVERVIEW_EDIT_NOTICE_DISMISS_KEY = "prospectre.editNotice.dismissed";
const OVERVIEW_EDIT_NOTICE_DISMISS_LIMIT = 10;

export function createEntityPanelController({
  els,
  state,
  typeConfig,
  typeLabels,
  overviewContextPrefix,
  getIdValue = getId,
  openContextPanel,
  destroyContentEditor,
  isMoodleHtmlEntity,
  ensureMoodleHtmlSupport,
  updateManifestFile,
  saveSession,
  renderProjectSwitcher,
  renderAnalysis,
  showToast,
  scheduleGraphResize,
  updateDeepLink,
  renderContentWithEntityLinks,
  copyDeepLink,
  decorateSmartLinks,
  applySyntaxHighlighting,
  renderEditForm,
  selectNode,
  addComment,
  saveDraft,
  activateRealtime,
  followUser,
  startReply,
  deleteComment,
  reactToComment,
  openEmojiPicker,
  reactToEntity,
  openEntityEmojiPicker,
  cssEscape,
  documentRef = document,
  windowRef = window
}) {
  function renderRightPanel() {
    const entity = state.entities.get(state.selectedId);
    if (!entity) return;
    const kicker = typeConfig[entity.type]?.singular || typeLabels[entity.type] || "Sélection";
    const badgeColor = typeConfig[entity.type]?.color || "#7dd3fc";
    els.panelKicker.textContent = kicker;
    els.panelTitle.textContent = entity.label;
    state.panelManager?.update("context", { title: entity.label, badge: { label: kicker, color: badgeColor } });
    openContextPanel();
    schedulePanelRender(entity, state.activeTab);
  }

  function getOverviewDiscussionEntity() {
    const manifest = state.projectManifest || {};
    return {
      id: getOverviewContextId(),
      type: "overview",
      label: manifest.titre || manifest.id || "Vue d’ensemble",
      summary: manifest.description || ""
    };
  }

  function getOverviewContextId() {
    return `${overviewContextPrefix}:${state.datasetId || state.projectManifest?.id || "project"}`;
  }

  function openOverviewDiscussion() {
    state.selectedId = null;
    state.selectedLinkKey = null;
    state.activeTab = "discussion";
    state.replyTo = null;
    state.highlightedCommentId = null;
    documentRef.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === "discussion"));
    const entity = getOverviewDiscussionEntity();
    els.panelKicker.textContent = "Vue d’ensemble";
    els.panelTitle.textContent = entity.label;
    state.panelManager?.update("context", { title: entity.label, badge: { label: "Vue d’ensemble", color: "var(--accent)" } });
    openContextPanel();
    schedulePanelRender(entity, "discussion");
    updateDeepLink();
    scheduleGraphResize();
  }

  function schedulePanelRender(entity, tab = state.activeTab) {
    if (!entity) return;
    const token = `${entity.id}:${tab}:${Date.now()}:${Math.random()}`;
    state.contextPanelRenderToken = token;
    renderPanelLoading(tab === "discussion" ? "discussion" : "details");
    const render = () => {
      if (state.contextPanelRenderToken !== token) return;
      if (tab === "discussion") renderDiscussionNow(entity);
      else renderOverview(entity);
    };
    if (typeof windowRef.requestAnimationFrame === "function") {
      windowRef.requestAnimationFrame(() => windowRef.setTimeout(render, 45));
      return;
    }
    windowRef.setTimeout(render, 45);
  }

  function renderPanelLoading(kind = "details") {
    destroyContentEditor();
    els.panelContent.innerHTML = renderPanelSkeleton(kind);
  }

  function renderOverviewMetaDetails() {
    destroyContentEditor();
    const manifest = state.projectManifest || {};
    if (state.editMode) {
      renderOverviewEditForm();
      return;
    }
    const generatedAt = formatManifestDate(manifest.date_generation);
    const fileCount = Array.isArray(manifest.fichiers) ? manifest.fichiers.length : state.files.size;
    els.panelContent.innerHTML = renderOverviewDetailsView({
      manifest,
      datasetId: state.datasetId,
      generatedAt,
      fileCount,
      coverUrl: resolveOverviewCoverPreviewUrl(manifest, state),
      manifestPath: formatManifestPath(state.projectManifestUrl)
    });
    els.panelContent.querySelector("[data-overview-edit-action]")?.addEventListener("click", () => {
      state.editMode = true;
      renderOverviewMetaDetails();
    });
    els.panelContent.querySelector("#overview-edit-toggle")?.addEventListener("change", (event) => {
      state.editMode = event.target.checked;
      renderOverviewMetaDetails();
    });
  }

  function renderOverviewEditForm() {
    const manifest = state.projectManifest || {};
    const generatedAt = formatManifestDate(manifest.date_generation);
    const fileCount = Array.isArray(manifest.fichiers) ? manifest.fichiers.length : state.files.size;
    els.panelContent.innerHTML = renderOverviewEditView({
      manifest,
      datasetId: state.datasetId,
      generatedAt,
      fileCount,
      showLocalNotice: shouldShowOverviewEditNotice(),
      coverPreviewUrl: resolveOverviewCoverPreviewUrl(manifest, state)
    });
    els.panelContent.querySelector("[data-dismiss-overview-edit-notice]")?.addEventListener("click", () => {
      incrementOverviewEditNoticeDismissCount();
      els.panelContent.querySelector("[data-overview-edit-notice]")?.remove();
    });
    els.panelContent.querySelector("#overview-edit-toggle")?.addEventListener("change", (event) => {
      state.editMode = event.target.checked;
      renderOverviewMetaDetails();
    });
    els.panelContent.querySelector("#overview-description-toggle")?.addEventListener("change", (event) => {
      const enabled = event.target.checked;
      const card = event.target.closest(".edit-option-card");
      const description = els.panelContent.querySelector("#overview-description");
      card?.classList.toggle("is-enabled", enabled);
      if (description) {
        description.disabled = !enabled;
        if (enabled) description.focus();
      }
    });
    els.panelContent.querySelector("#overview-cover-toggle")?.addEventListener("change", (event) => {
      setOverviewCoverOptionEnabled(els.panelContent, event.target.checked);
    });
    els.panelContent.querySelector("#overview-cover-source")?.addEventListener("input", (event) => {
      setOverviewCoverValue(els.panelContent, event.target.value.trim());
    });
    els.panelContent.querySelector("#overview-cover-file")?.addEventListener("change", async (event) => {
      const [file] = event.target.files || [];
      if (!file) return;
      const extension = getImageExtensionFromFile(file);
      const uuid = windowRef.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const path = `assets/uploads/manifest-cover-${uuid}.${extension}`;
      const dataUrl = await blobToDataUrl(file);
      state.files.set(path, { path, dataUrl, binary: true });
      setOverviewCoverValue(els.panelContent, path, dataUrl);
    });
    els.panelContent.querySelector("#clear-overview-cover")?.addEventListener("click", () => {
      setOverviewCoverValue(els.panelContent, "");
    });
    els.panelContent.querySelector("#apply-overview-adjust")?.addEventListener("click", () => {
      const title = els.panelContent.querySelector("#overview-title")?.value.trim();
      const descriptionEnabled = Boolean(els.panelContent.querySelector("#overview-description-toggle")?.checked);
      const description = descriptionEnabled ? els.panelContent.querySelector("#overview-description")?.value.trim() || "" : "";
      const coverEnabled = Boolean(els.panelContent.querySelector("#overview-cover-toggle")?.checked);
      const cover = coverEnabled ? els.panelContent.querySelector("#overview-cover-source")?.value.trim() || "" : "";
      state.projectManifest ||= {};
      if (title) state.projectManifest.titre = title;
      if (description) state.projectManifest.description = description;
      else delete state.projectManifest.description;
      if (cover) state.projectManifest.cover = cover;
      else delete state.projectManifest.cover;
      updateManifestFile();
      saveSession();
      renderProjectSwitcher();
      renderAnalysis();
      state.editMode = false;
      renderOverviewMetaDetails();
      showToast("Détails du projet enregistrés");
    });
    els.panelContent.querySelector("#cancel-overview-adjust")?.addEventListener("click", () => {
      state.editMode = false;
      renderOverviewMetaDetails();
    });
  }

  function renderOverview(entity) {
    destroyContentEditor();
    const renderFormat = getEntityRenderFormat(entity);
    if (renderFormat === "html" && isMoodleHtmlEntity(entity)) ensureMoodleHtmlSupport();
    if (state.editMode) {
      renderEditForm(entity);
      return;
    }
    const relatedHtml = renderInlineRelations(entity, {
      links: state.graph.links.filter((link) => getIdValue(link.source) === entity.id || getIdValue(link.target) === entity.id),
      entities: state.entities
    });
    const summary = getVisibleEntitySummary(entity, { isMoodleHtmlEntity });
    els.panelContent.innerHTML = renderEntityReadView({
      entity,
      summaryHtml: summary ? renderSummaryCallout(entity, summary) : "",
      contentHtml: renderContentWithEntityLinks(entity.body, entity.path, renderFormat),
      relatedHtml
    });
    els.panelContent.querySelector("[data-entity-edit-action]")?.addEventListener("click", () => {
      state.editMode = true;
      renderRightPanel();
    });
    els.panelContent.querySelector("#edit-toggle").addEventListener("change", (event) => {
      state.editMode = event.target.checked;
      renderRightPanel();
    });
    els.panelContent.querySelector("[data-copy-entity-link]")?.addEventListener("click", () => copyDeepLink({ entityId: entity.id }));
    highlightRenderedSearchMatches();
    decorateSmartLinks(els.panelContent);
    applySyntaxHighlighting(els.panelContent);
    bindInlineEntityClicks();
  }

  function isSummaryOptionEnabled(entity) {
    return Boolean(getVisibleEntitySummary(entity, { isMoodleHtmlEntity }));
  }

  function bindInlineEntityClicks() {
    els.panelContent.querySelectorAll("[data-node]").forEach((button) => {
      button.addEventListener("click", () => selectNode(button.dataset.node, true));
    });
  }

  function highlightRenderedSearchMatches() {
    if (!state.searchQuery.trim()) return;
    const root = els.panelContent.querySelector(".rendered-content");
    if (!root) return;
    const pattern = escapeRegExp(state.searchQuery.trim());
    if (!pattern) return;
    const regex = new RegExp(pattern, "gi");
    const walker = documentRef.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue.trim() || !regex.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        regex.lastIndex = 0;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const fragment = documentRef.createDocumentFragment();
      let lastIndex = 0;
      node.nodeValue.replace(regex, (match, offset) => {
        fragment.append(documentRef.createTextNode(node.nodeValue.slice(lastIndex, offset)));
        const mark = documentRef.createElement("mark");
        mark.className = "search-highlight";
        mark.textContent = match;
        fragment.append(mark);
        lastIndex = offset + match.length;
        return match;
      });
      fragment.append(documentRef.createTextNode(node.nodeValue.slice(lastIndex)));
      node.parentNode.replaceChild(fragment, node);
    }
  }

  function renderDiscussion(entity = state.entities.get(state.selectedId)) {
    if (!entity) return;
    schedulePanelRender(entity, "discussion");
  }

  function renderDiscussionNow(entity = state.entities.get(state.selectedId)) {
    if (!entity) return;
    state.currentDiscussionEntityId = entity.id;
    els.panelContent.innerHTML = state.discussionRenderer.renderPanel(entity);
    bindDiscussionPanel({
      root: els.panelContent,
      entity,
      state,
      addComment,
      saveDraft,
      activateRealtime,
      renderRightPanel,
      followUser,
      startReply,
      copyDeepLink,
      deleteComment,
      reactToComment,
      openEmojiPicker,
      reactToEntity,
      openEntityEmojiPicker,
      cssEscape
    });
  }

  return {
    renderRightPanel,
    getOverviewDiscussionEntity,
    getOverviewContextId,
    openOverviewDiscussion,
    renderOverviewMetaDetails,
    renderOverviewEditForm,
    renderOverview,
    isSummaryOptionEnabled,
    bindInlineEntityClicks,
    highlightRenderedSearchMatches,
    renderDiscussion
  };
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function shouldShowOverviewEditNotice() {
  return getOverviewEditNoticeDismissCount() < OVERVIEW_EDIT_NOTICE_DISMISS_LIMIT;
}

function getOverviewEditNoticeDismissCount() {
  try {
    return Math.max(0, Number(localStorage.getItem(OVERVIEW_EDIT_NOTICE_DISMISS_KEY) || 0) || 0);
  } catch {
    return 0;
  }
}

function incrementOverviewEditNoticeDismissCount() {
  try {
    localStorage.setItem(OVERVIEW_EDIT_NOTICE_DISMISS_KEY, String(getOverviewEditNoticeDismissCount() + 1));
  } catch {
    // Non-critical preference.
  }
}

function getImageExtensionFromFile(file) {
  const fromName = String(file?.name || "").split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName === "jpeg" ? "jpg" : fromName;
  return {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg"
  }[file?.type] || "png";
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(blob);
  });
}

function resolveOverviewCoverPreviewUrl(manifest = {}, state) {
  const raw = getManifestCover(manifest);
  if (!raw || /^(https?:|data:|blob:)/i.test(raw)) return raw || "";
  const file = state?.files?.get(raw) || state?.files?.get(raw.replace(/^\.\//, ""));
  return file?.dataUrl || raw;
}

function formatManifestPath(value = "") {
  if (!value) return "manifest.json";
  try {
    const path = new URL(value, document.baseURI).pathname;
    const parts = decodeURIComponent(path).split("/").filter(Boolean);
    return parts.slice(-2).join("/") || "manifest.json";
  } catch {
    const parts = String(value).split(/[\\/]/).filter(Boolean);
    return parts.slice(-2).join("/") || "manifest.json";
  }
}
