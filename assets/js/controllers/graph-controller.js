import { computeCameraFitForNodes } from "../graph/camera-model.js";

export function createGraphController({
  state,
  els,
  resetView,
  openExternal,
  requestFullscreen,
  panelManager,
  renderPresence,
  positionOpenToolbarPopover,
  fitPadding = 18,
  resetFitPadding = 24,
  focusFitPadding = 14,
  initialFitDelay = 900,
  requestAnimationFrameRef = requestAnimationFrame
} = {}) {
  function reset({ resetPanels = true } = {}) {
    if (resetPanels) panelManager?.resetLayout?.();
    resetView?.({ resetPanels: false });
  }

  function fit(duration = 700, padding = fitPadding) {
    state?.graphView?.zoomToFit(duration, padding);
  }

  function focusSelectedLinkPath(sourceId, targetId) {
    const ids = state.selectedLinkPathIds?.size ? state.selectedLinkPathIds : new Set([sourceId, targetId]);
    fitNodeSet(ids, {
      duration: 720,
      padding: focusFitPadding,
      fallbackId: state.entities.has(targetId) ? targetId : sourceId
    });
  }

  function scheduleInitialFit() {
    clearTimeout(state.initialFitTimer);
    state.initialFitTimer = setTimeout(() => fit(850, fitPadding), initialFitDelay);
    clearTimeout(state.initialTightFitTimer);
    state.initialTightFitTimer = setTimeout(() => fit(650, 12), initialFitDelay + 650);
  }

  function zoom(factor) {
    const camera = state.graphView.camera();
    state.graphView.cameraPosition({
      x: camera.position.x * factor,
      y: camera.position.y * factor,
      z: camera.position.z * factor
    }, undefined, 450);
  }

  function focusNode(id, distance = 180) {
    const node = state.graph.nodes.find((item) => item.id === id);
    if (!node || node.x == null) return;
    const length = Math.hypot(node.x, node.y, node.z) || 1;
    const ratio = 1 + distance / length;
    state.graphView.cameraPosition({ x: node.x * ratio, y: node.y * ratio, z: node.z * ratio }, node, 850);
  }

  function fitFocusedSelection(fallbackId = state.selectedId) {
    if (state.selectedLinkKey && state.selectedLinkPathIds?.size) {
      fitNodeSet(state.selectedLinkPathIds, { duration: 720, padding: focusFitPadding, fallbackId });
      return;
    }
    if (state.selectedId && state.selectedPathIds?.size) {
      fitNodeSet(state.selectedPathIds, { duration: 720, padding: focusFitPadding, fallbackId: state.selectedId });
      return;
    }
    if (fallbackId) focusNode(fallbackId, 120);
  }

  function fitNodeSet(ids, options = {}) {
    const nodeIds = ids instanceof Set ? ids : new Set(ids || []);
    const targets = state.visibleGraph.nodes.filter((node) => nodeIds.has(node.id) && node.x != null);
    if (targets.length >= 2) {
      tightenCameraOnNodes(targets, options);
      return;
    }
    focusNode(options.fallbackId || targets[0]?.id, 110);
  }

  function tightenCameraOnNodes(nodes, options = {}) {
    const camera = state.graphView.camera();
    const fitResult = computeCameraFitForNodes(nodes, camera.position, getAspectRatio());
    if (!fitResult) return;
    state.graphView.cameraPosition(fitResult.target, fitResult.center, options.duration || 620);
  }

  function getAspectRatio() {
    const rect = els.graphStage.getBoundingClientRect();
    return Math.max(0.7, Math.min(2.4, rect.width / Math.max(1, rect.height)));
  }

  function resize() {
    if (!state.graphView) return;
    const rect = els.graphStage.getBoundingClientRect();
    state.graphView.width(Math.max(320, rect.width)).height(Math.max(240, rect.height));
    renderPresence?.();
    positionOpenToolbarPopover?.();
  }

  function scheduleResize() {
    clearTimeout(state.graphResizeTimer);
    resize();
    state.graphResizeTimer = setTimeout(resize, 220);
    requestAnimationFrameRef(() => requestAnimationFrameRef(resize));
  }

  function externalize() {
    openExternal?.();
  }

  function fullscreen() {
    return requestFullscreen?.();
  }

  return {
    mount() {},
    unmount() {},
    reset,
    fit,
    focusSelectedLinkPath,
    scheduleInitialFit,
    zoom,
    focusNode,
    fitFocusedSelection,
    fitNodeSet,
    tightenCameraOnNodes,
    getAspectRatio,
    resize,
    scheduleResize,
    externalize,
    fullscreen
  };
}
