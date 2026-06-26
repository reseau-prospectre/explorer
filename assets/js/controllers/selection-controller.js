import { cssEscape, getId } from "../core/utils.js";
import {
  createSelectionDeepLinkUrl,
  getInitialDeepLinkRequest
} from "../services/project-launch.js?v=20260626-v324-library-reperes-1";

export function createSelectionController({
  els,
  state,
  renderRightPanel,
  renderAnalysis,
  openContextPanel,
  updateVisibleGraph,
  scheduleGraphResize,
  fitFocusedSelection,
  focusSelectedLinkPath,
  getLinkKey,
  showToast,
  documentRef = document,
  windowRef = window,
  navigatorRef = navigator,
  requestAnimationFrameRef = requestAnimationFrame
}) {
  function selectNode(id, moveCamera = false) {
    state.selectedId = id;
    state.selectedLinkKey = null;
    state.focusSuppressed = false;
    state.selectedLinkPathIds = new Set();
    state.selectedLinkPathLinkKeys = new Set();
    state.highlightedCommentId = null;
    state.provider?.updatePresence({ selectedNodeId: id });
    renderRightPanel();
    renderAnalysis();
    openContextPanel();
    updateVisibleGraph();
    scheduleGraphResize();
    if (moveCamera) fitFocusedSelection(id);
    updateDeepLink();
    state.appStore?.dispatch({ type: "state:patch", scope: "selection", patch: { selection: { selectedId: id, selectedLinkKey: null, activeTab: state.activeTab } } });
    if (!state.bridgeApplying) state.windowBridge?.publish("selection:set", { id, moveCamera: false, activeTab: state.activeTab });
  }

  function selectContributionNode(node, moveCamera = false) {
    state.selectedId = node.entityId;
    state.selectedLinkKey = null;
    state.focusSuppressed = false;
    state.selectedLinkPathIds = new Set();
    state.selectedLinkPathLinkKeys = new Set();
    state.activeTab = "discussion";
    state.replyTo = null;
    state.highlightedCommentId = node.commentId;
    documentRef.querySelectorAll(".tab").forEach((item) => item.classList.toggle("active", item.dataset.tab === "discussion"));
    state.provider?.updatePresence({ selectedNodeId: node.entityId });
    renderRightPanel();
    renderAnalysis();
    openContextPanel();
    updateVisibleGraph();
    scheduleGraphResize();
    if (moveCamera) fitFocusedSelection(node.entityId || node.id);
    updateDeepLink(node.commentId);
    state.appStore?.dispatch({ type: "state:patch", scope: "selection", patch: { selection: { selectedId: node.entityId, selectedLinkKey: null, activeTab: state.activeTab, commentId: node.commentId } } });
    if (!state.bridgeApplying) state.windowBridge?.publish("selection:set", { id: node.entityId, moveCamera: false, activeTab: state.activeTab, commentId: node.commentId });
    requestAnimationFrameRef(() => {
      els.panelContent.querySelector(`[data-comment-id="${cssEscape(node.commentId)}"], [data-thread="${cssEscape(node.commentId)}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  }

  function selectLink(link) {
    state.selectedLinkKey = getLinkKey(link);
    state.focusSuppressed = false;
    state.highlightedCommentId = null;
    const targetId = getId(link.target);
    const sourceId = getId(link.source);
    updateVisibleGraph();
    renderAnalysis();
    focusSelectedLinkPath(sourceId, targetId);
    state.appStore?.dispatch({ type: "state:patch", scope: "selection", patch: { selection: { selectedId: null, selectedLinkKey: state.selectedLinkKey, activeTab: state.activeTab } } });
  }

  function exitGraphFocus() {
    if (!state.graphPrefs.focusMode || state.focusSuppressed || (!state.selectedId && !state.selectedLinkKey && !state.searchMatchedIds?.size)) return;
    state.focusSuppressed = true;
    state.hoveredLinkKey = null;
    updateVisibleGraph();
    renderAnalysis();
  }

  function applyInitialDeepLink() {
    const request = getInitialDeepLinkRequest(windowRef.location.search, state.entities);
    if (!request) return;
    state.activeTab = request.activeTab;
    state.highlightedCommentId = request.commentId;
    selectNode(request.entityId, false);
    state.highlightedCommentId = request.commentId;
    documentRef.querySelectorAll("#panel-tabs .tab").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.tab === state.activeTab);
    });
    renderRightPanel();
    updateDeepLink(state.highlightedCommentId);
    if (state.highlightedCommentId) {
      requestAnimationFrameRef(() => {
        els.panelContent.querySelector(`[data-comment-id="${cssEscape(state.highlightedCommentId)}"], [data-thread="${cssEscape(state.highlightedCommentId)}"]`)?.scrollIntoView({ block: "center" });
      });
    }
  }

  function buildDeepLink({ entityId = state.selectedId, tab = state.activeTab, commentId = null } = {}) {
    return createSelectionDeepLinkUrl(windowRef.location.href, { entityId, tab, commentId });
  }

  function updateDeepLink(commentId = state.highlightedCommentId) {
    const url = buildDeepLink({ commentId });
    windowRef.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  async function copyDeepLink(options = {}) {
    const url = buildDeepLink(options).href;
    try {
      await navigatorRef.clipboard.writeText(url);
    } catch {
      const input = documentRef.createElement("textarea");
      input.value = url;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      documentRef.body.append(input);
      input.select();
      documentRef.execCommand("copy");
      input.remove();
    }
    showToast("Lien copié");
  }

  return {
    selectNode,
    selectContributionNode,
    selectLink,
    exitGraphFocus,
    applyInitialDeepLink,
    buildDeepLink,
    updateDeepLink,
    copyDeepLink
  };
}
