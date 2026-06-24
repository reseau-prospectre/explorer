import { getId } from "../core/utils.js";
import { formatManifestDate } from "../ui/insight-model.js";
import {
  getEntityRenderFormat,
  getVisibleEntitySummary,
  renderEntityReadView,
  renderInlineRelations
} from "../ui/entity-view.js";
import { renderSummaryCallout } from "../ui/editor-view.js";
import {
  renderOverviewDetailsView,
  renderOverviewEditView
} from "../ui/overview-view.js";
import { bindDiscussionPanel } from "./discussion-panel-controller.js";

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
  documentRef = document
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
    if (state.activeTab === "overview") renderOverview(entity);
    if (state.activeTab === "discussion") renderDiscussion(entity);
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
    renderDiscussion(entity);
    updateDeepLink();
    scheduleGraphResize();
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
      fileCount
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
      fileCount
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
    els.panelContent.querySelector("#apply-overview-adjust")?.addEventListener("click", () => {
      const title = els.panelContent.querySelector("#overview-title")?.value.trim();
      const descriptionEnabled = Boolean(els.panelContent.querySelector("#overview-description-toggle")?.checked);
      const description = descriptionEnabled ? els.panelContent.querySelector("#overview-description")?.value.trim() || "" : "";
      state.projectManifest ||= {};
      if (title) state.projectManifest.titre = title;
      if (description) state.projectManifest.description = description;
      else delete state.projectManifest.description;
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
