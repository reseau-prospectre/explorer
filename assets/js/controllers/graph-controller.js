export function createGraphController({
  resetView,
  fitVisibleGraph,
  scheduleGraphResize,
  openExternal,
  requestFullscreen,
  panelManager
} = {}) {
  function reset({ resetPanels = true } = {}) {
    if (resetPanels) panelManager?.resetLayout?.();
    resetView?.({ resetPanels: false });
  }

  function fit(duration, padding) {
    fitVisibleGraph?.(duration, padding);
  }

  function resize() {
    scheduleGraphResize?.();
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
    resize,
    externalize,
    fullscreen
  };
}
