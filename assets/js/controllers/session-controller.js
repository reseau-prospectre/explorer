import { loadJson } from "../core/utils.js";
import {
  applyNodePositionToSource,
  applyStoredGraphLayout,
  clearGraphNodePosition,
  createSessionSnapshot,
  draftKey,
  getProjectSessionKey as getProjectSessionKeyValue,
  persistGraphNodePosition
} from "../services/session-model.js";

export function createSessionController({
  state,
  storageKeys,
  updateVisibleGraph,
  showToast,
  storage = localStorage
}) {
  const {
    session: sessionKey,
    projectSessions: projectSessionsKey,
    comments: commentsKey,
    entityReactions: entityReactionsKey,
    drafts: draftsKey,
    activityRead: activityReadKey,
    graphLayout: graphLayoutKey
  } = storageKeys;

  function getProjectSessionKey(manifest = state.projectManifest) {
    return getProjectSessionKeyValue({ manifest, datasetId: state.datasetId });
  }

  function getStoredLayouts() {
    return loadJson(graphLayoutKey, {});
  }

  function restoreGraphLayout() {
    const layout = getStoredLayouts()[getProjectSessionKey()] || {};
    applyStoredGraphLayout(state.graph.nodes, layout);
  }

  function persistNodePosition(node) {
    const layouts = getStoredLayouts();
    persistGraphNodePosition(layouts, getProjectSessionKey(), node);
    storage.setItem(graphLayoutKey, JSON.stringify(layouts));
  }

  function clearPersistedNodeLayout(nodeId) {
    const layouts = getStoredLayouts();
    clearGraphNodePosition(layouts, getProjectSessionKey(), nodeId);
    storage.setItem(graphLayoutKey, JSON.stringify(layouts));
  }

  function applyNodePosition(node) {
    applyNodePositionToSource(state.graph.nodes, node);
  }

  function releaseNodeFreeformPosition(node) {
    const nodeId = node?.id;
    if (!nodeId || node.type === "contribution") return;
    clearPersistedNodeLayout(nodeId);
    const targets = [node, state.graph.nodes.find((item) => item.id === nodeId), state.visibleGraph.nodes.find((item) => item.id === nodeId)];
    for (const target of targets) {
      if (!target) continue;
      target.fx = undefined;
      target.fy = undefined;
      target.fz = undefined;
    }
    state.graphView?.d3ReheatSimulation?.();
    updateVisibleGraph({ skipPositionSync: true });
    showToast("Position libre relâchée");
  }

  function clearPersistedLayout() {
    const layouts = getStoredLayouts();
    delete layouts[getProjectSessionKey()];
    storage.setItem(graphLayoutKey, JSON.stringify(layouts));
  }

  function releaseGraphLayout() {
    for (const node of state.graph.nodes) {
      node.fx = undefined;
      node.fy = undefined;
      node.fz = undefined;
    }
  }

  function resetGraphInteractionState() {
    state.selectedId = null;
    state.selectedLinkKey = null;
    state.hoveredLinkKey = null;
    state.focusSuppressed = false;
    state.selectedLinkPathIds = new Set();
    state.selectedLinkPathLinkKeys = new Set();
    state.selectedPathIds = new Set();
    state.selectedPathLinkKeys = new Set();
    state.highlightedCommentId = null;
  }

  function saveSession() {
    const snapshot = createSessionSnapshot({
      projectManifest: state.projectManifest,
      datasetId: state.datasetId,
      projectManifestUrl: state.projectManifestUrl,
      files: state.files
    });
    storage.setItem(sessionKey, JSON.stringify(snapshot));
    const sessions = loadJson(projectSessionsKey, {});
    sessions[getProjectSessionKey(state.projectManifest)] = snapshot;
    storage.setItem(projectSessionsKey, JSON.stringify(sessions));
  }

  function persistComments() {
    storage.setItem(commentsKey, JSON.stringify(state.comments));
  }

  function persistEntityReactions() {
    storage.setItem(entityReactionsKey, JSON.stringify(state.entityReactions));
  }

  function getDraft(entityId, parentId) {
    return state.drafts[draftKey(entityId, parentId)] || "";
  }

  function saveDraft(entityId, parentId, value) {
    const key = draftKey(entityId, parentId);
    if (value) state.drafts[key] = value;
    else delete state.drafts[key];
    storage.setItem(draftsKey, JSON.stringify(state.drafts));
  }

  function clearDraft(entityId, parentId) {
    saveDraft(entityId, parentId, "");
  }

  function persistActivityRead() {
    storage.setItem(activityReadKey, JSON.stringify([...state.activityRead]));
  }

  return {
    getProjectSessionKey,
    getStoredLayouts,
    restoreGraphLayout,
    persistNodePosition,
    clearPersistedNodeLayout,
    applyNodePosition,
    releaseNodeFreeformPosition,
    clearPersistedLayout,
    releaseGraphLayout,
    resetGraphInteractionState,
    saveSession,
    persistComments,
    persistEntityReactions,
    getDraft,
    saveDraft,
    clearDraft,
    persistActivityRead
  };
}
