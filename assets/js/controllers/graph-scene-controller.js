import { escapeHtml, getId } from "../core/utils.js";
import {
  buildVisibleGraph,
  getSelectedLinkPath as getSelectedLinkPathModel,
  getSelectedNodePath as getSelectedNodePathModel,
  getSelectedPathIds as getSelectedPathIdsModel
} from "../graph/focus-model.js";
import { syncGraphPositionsFromVisible } from "../services/session-model.js";

export function createGraphSceneController({
  els,
  state,
  defaultGraphPrefs,
  linkFocusMaxLinks = 96,
  makeNodeObject,
  getLinkKey,
  getLinkTargetColor,
  getLinkDistance,
  selectNode,
  selectContributionNode,
  selectLink,
  exitGraphFocus,
  applyNodePosition,
  persistNodePosition,
  releaseNodeFreeformPosition,
  updateFocusDepthLabel,
  renderPresence,
  renderPresenceStrip,
  renderAnalysis,
  resizeGraph,
  forceGraphFactory = () => window.ForceGraph3D
} = {}) {
  function setup() {
    const ForceGraph3D = forceGraphFactory();
    state.graphView = ForceGraph3D()(els.graphStage)
      .backgroundColor("rgba(0,0,0,0)")
      .showNavInfo(false)
      .cooldownTicks(42)
      .warmupTicks(0)
      .nodeId("id")
      .nodeLabel((node) => graphHoverLabel(node))
      .nodeThreeObject(makeNodeObject)
      .nodeThreeObjectExtend(false)
      .linkColor(getGraphLinkColor)
      .linkWidth(getGraphLinkWidth)
      .linkDirectionalParticles(getGraphLinkParticles)
      .linkDirectionalParticleWidth(1.05)
      .linkDirectionalParticleColor((link) => getLinkTargetColor(link))
      .linkDirectionalParticleSpeed(0.0032)
      .onNodeClick((node) => {
        state.selectedLinkKey = null;
        state.selectedLinkPathIds = new Set();
        state.selectedLinkPathLinkKeys = new Set();
        if (node.type === "contribution") selectContributionNode(node, true);
        else selectNode(node.id, true);
      })
      .onLinkClick((link) => selectLink(link))
      .onBackgroundClick(() => exitGraphFocus())
      .onLinkHover((link) => {
        state.hoveredLinkKey = link ? getLinkKey(link) : null;
        els.graphStage.style.cursor = link ? "pointer" : "default";
        refreshGraphLinkStyles();
      })
      .onNodeDrag((node) => {
        node.fx = node.x;
        node.fy = node.y;
        node.fz = node.z;
        applyNodePosition(node);
      })
      .onNodeDragEnd((node) => {
        node.fx = node.x;
        node.fy = node.y;
        node.fz = node.z;
        applyNodePosition(node);
        persistNodePosition(node);
      })
      .onNodeHover((node) => {
        els.graphStage.style.cursor = node || state.hoveredLinkKey ? "pointer" : "default";
      })
      .onEngineTick(() => {
        state.tick = (state.tick || 0) + 1;
        if (state.tick % 3 === 0) renderPresence();
      });
    state.graphView.onNodeRightClick?.((node) => releaseNodeFreeformPosition(node));
    state.graphView.d3Force("charge").strength(-105);
    state.graphView.d3Force("link").distance((link) => getLinkDistance(link));
    state.graphView.d3AlphaDecay?.(0.055);
    state.graphView.d3VelocityDecay?.(0.46);
    window.addEventListener("resize", resizeGraph);
    els.graphStage.addEventListener("contextmenu", (event) => event.preventDefault());
    resizeGraph();
  }

  function updateVisibleGraph(options = {}) {
    if (!options.skipPositionSync) syncGraphPositionsFromView();
    const selectedLinkPaths = getSelectedLinkPath();
    const selectedNodePaths = getSelectedNodePath();
    state.selectedLinkPathIds = selectedLinkPaths.nodeIds;
    state.selectedLinkPathLinkKeys = selectedLinkPaths.linkKeys;
    const selectedPathIds = getSelectedPathIds(selectedLinkPaths, selectedNodePaths);
    const selectedPathLinkKeys = state.selectedLinkKey ? selectedLinkPaths.linkKeys : selectedNodePaths.linkKeys;
    state.selectedPathIds = selectedPathIds;
    state.selectedPathLinkKeys = selectedPathLinkKeys;
    const focusActive = isGraphFocusActive();
    state.visibleGraph = buildVisibleGraph({
      graph: state.graph,
      activeTypes: state.activeTypes,
      realtimeStatus: state.realtimeStatus,
      focusActive,
      selectedPathIds,
      selectedPathLinkKeys,
      selectedLinkKey: state.selectedLinkKey,
      selectedId: state.selectedId,
      selectedLinkPaths,
      hoveredLinkKey: state.hoveredLinkKey,
      getLinkKey
    });
    state.graphView.graphData(state.visibleGraph);
    softenGraphMotion();
    updateFocusDepthLabel();
    renderPresence();
    renderPresenceStrip();
    if (!isProjectLoading()) renderAnalysis();
    setTimeout(renderPresence, 300);
  }

  function isProjectLoading() {
    return state.loadingPhase?.phase === "project-loading";
  }

  function syncGraphPositionsFromView() {
    syncGraphPositionsFromVisible(state.graph.nodes, state.visibleGraph?.nodes);
  }

  function getSelectedPathIds(selectedLinkPaths = getSelectedLinkPath(), selectedNodePaths = getSelectedNodePath()) {
    return getSelectedPathIdsModel({
      searchMatchedIds: state.searchMatchedIds,
      selectedLinkKey: state.selectedLinkKey,
      selectedId: state.selectedId,
      selectedLinkPaths,
      selectedNodePaths
    });
  }

  function getSelectedNodePath() {
    return getSelectedNodePathModel({
      selectedId: state.selectedId,
      links: state.graph.links,
      focusDepth: getFocusDepth(),
      getLinkKey
    });
  }

  function getSelectedLinkPath() {
    return getSelectedLinkPathModel({
      selectedLinkKey: state.selectedLinkKey,
      links: state.graph.links,
      entities: state.entities,
      focusDepth: getFocusDepth(),
      getLinkKey,
      maxLinks: linkFocusMaxLinks
    });
  }

  function getFocusDepth() {
    return Math.max(1, Math.min(5, Number(state.graphPrefs.focusDepth || defaultGraphPrefs.focusDepth)));
  }

  function isLinkHighlighted(link) {
    if (state.focusSuppressed) return false;
    const key = getLinkKey(link);
    if (state.selectedLinkKey) return Boolean(link.highlight) || state.selectedLinkPathLinkKeys?.has(key);
    return Boolean(link.highlight)
      || state.selectedLinkPathLinkKeys?.has(key)
      || (state.selectedPathIds?.has(getId(link.source)) && state.selectedPathIds?.has(getId(link.target)));
  }

  function isGraphFocusActive() {
    return Boolean(state.graphPrefs.focusMode && !state.focusSuppressed && (state.selectedId || state.selectedLinkKey || state.searchMatchedIds?.size));
  }

  function hasAnimatedSelection() {
    return Boolean(!state.focusSuppressed && (state.selectedId || state.selectedLinkKey));
  }

  function getGraphLinkColor(link) {
    if (!state.graphPrefs.showLinks) return "rgba(0,0,0,0)";
    if (isLinkHighlighted(link)) return getLinkTargetColor(link);
    if (state.hoveredLinkKey === getLinkKey(link)) return "rgba(237, 247, 246, 0.7)";
    if (isGraphFocusActive()) return "rgba(115, 133, 139, 0)";
    return "rgba(180, 210, 214, 0.13)";
  }

  function getGraphLinkWidth(link) {
    if (!state.graphPrefs.showLinks) return 0;
    if (isLinkHighlighted(link)) return Math.max(1.65, Math.min(3.2, (link.weight || 1) * 1.14));
    if (state.hoveredLinkKey === getLinkKey(link)) return 1.3;
    if (isGraphFocusActive()) return 0;
    return Math.max(0.18, (link.weight || 1) * 0.22);
  }

  function getGraphLinkParticles(link) {
    if (!state.graphPrefs.showLinks || !state.graphPrefs.showMotion) return 0;
    if (!hasAnimatedSelection()) return 0;
    return isLinkHighlighted(link) ? 1 : 0;
  }

  function refreshGraphLinkStyles() {
    if (!state.graphView) return;
    state.graphView
      .linkColor(getGraphLinkColor)
      .linkWidth(getGraphLinkWidth)
      .linkDirectionalParticles(getGraphLinkParticles);
  }

  function softenGraphMotion() {
    state.graphView.d3AlphaTarget?.(0);
    state.graphView.d3VelocityDecay?.(0.5);
    setTimeout(() => state.graphView?.d3AlphaTarget?.(0), 160);
  }

  function graphHoverLabel(node) {
    if (!node?.label) return "";
    const light = document.documentElement.dataset.theme === "light";
    const background = light ? "rgba(255,255,255,0.96)" : "rgba(7,16,21,0.92)";
    const color = light ? "#10242c" : "#f1f8f7";
    const border = light ? "rgba(22,54,64,0.24)" : "rgba(216,239,238,0.28)";
    return `<div style="max-width:240px;padding:6px 9px;border:1px solid ${border};border-radius:7px;background:${background};color:${color};box-shadow:0 12px 30px rgba(0,0,0,.18);font:800 12px/1.25 Inter,system-ui,sans-serif;text-align:center;white-space:normal;">${escapeHtml(node.label)}</div>`;
  }

  return {
    setup,
    updateVisibleGraph,
    syncGraphPositionsFromView,
    getSelectedPathIds,
    getSelectedNodePath,
    getSelectedLinkPath,
    getFocusDepth,
    isLinkHighlighted,
    isGraphFocusActive,
    hasAnimatedSelection,
    getGraphLinkColor,
    getGraphLinkWidth,
    getGraphLinkParticles,
    refreshGraphLinkStyles,
    softenGraphMotion,
    graphHoverLabel
  };
}
