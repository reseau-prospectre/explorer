export const GRAPH_TOOLBAR_PREFS_KEY = "prospectre.ui.v3.graphToolbar";

const EDGES = ["left", "right", "top", "bottom", "free"];

export function createGraphToolbarController({
  toolbar,
  storageKey = GRAPH_TOOLBAR_PREFS_KEY,
  onChange
} = {}) {
  let drag = null;

  function mount() {
    if (!toolbar) return;
    apply(loadPreferences(storageKey));
    toolbar.addEventListener("pointerdown", beginDrag);
  }

  function destroy() {
    toolbar?.removeEventListener("pointerdown", beginDrag);
    finishDrag();
  }

  function apply(prefs) {
    if (!toolbar) return;
    const next = normalizeGraphToolbarPrefs(prefs);
    toolbar.dataset.mode = next.mode;
    toolbar.dataset.edge = next.edge;
    toolbar.style.setProperty("--toolbar-x", `${Math.round(next.x)}px`);
    toolbar.style.setProperty("--toolbar-y", `${Math.round(next.y)}px`);
    localStorage.setItem(storageKey, JSON.stringify(next));
    onChange?.(next);
  }

  function reset() {
    apply(normalizeGraphToolbarPrefs({ mode: "dock", edge: "left", x: 10, y: 92 }));
  }

  function getPreferences() {
    return normalizeGraphToolbarPrefs(loadPreferences(storageKey));
  }

  function beginDrag(event) {
    if (event.button !== 0 || !toolbar || drag) return;
    if (event.target.closest("button, a, input, textarea, select, [role='button']")) return;
    event.preventDefault();
    const rect = toolbar.getBoundingClientRect();
    drag = {
      pointerId: event.pointerId,
      initial: { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      prefs: getPreferences()
    };
    toolbar.classList.add("is-dragging");
    toolbar.dataset.mode = "float";
    toolbar.setPointerCapture?.(event.pointerId);
    toolbar.addEventListener("pointermove", moveDrag);
    toolbar.addEventListener("pointerup", commitDrag);
    toolbar.addEventListener("pointercancel", cancelDrag);
    toolbar.addEventListener("lostpointercapture", cancelDrag);
  }

  function moveDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId || !toolbar) return;
    const x = clamp(drag.initial.left + event.clientX - drag.initial.x, 8, window.innerWidth - drag.initial.width - 8);
    const y = clamp(drag.initial.top + event.clientY - drag.initial.y, getTopbarHeight(), window.innerHeight - drag.initial.height - 8);
    toolbar.style.setProperty("--toolbar-x", `${Math.round(x)}px`);
    toolbar.style.setProperty("--toolbar-y", `${Math.round(y)}px`);
    toolbar.dataset.edge = graphToolbarEdgeAt(event.clientX, event.clientY) || "free";
    onChange?.(normalizeGraphToolbarPrefs({ mode: "float", edge: toolbar.dataset.edge, x, y }));
  }

  function commitDrag(event) {
    if (!drag || (event.pointerId !== undefined && event.pointerId !== drag.pointerId) || !toolbar) return;
    const rect = toolbar.getBoundingClientRect();
    const edge = graphToolbarEdgeAt(event.clientX, event.clientY);
    const prefs = edge
      ? { ...drag.prefs, mode: "dock", edge, x: Math.round(rect.left), y: Math.round(rect.top) }
      : { ...drag.prefs, mode: "float", edge: "free", x: Math.round(rect.left), y: Math.round(rect.top) };
    finishDrag();
    apply(prefs);
  }

  function cancelDrag() {
    if (!drag) return;
    const previous = drag.prefs;
    finishDrag();
    apply(previous);
  }

  function finishDrag() {
    if (!toolbar) return;
    const pointerId = drag?.pointerId;
    toolbar.classList.remove("is-dragging");
    toolbar.removeEventListener("pointermove", moveDrag);
    toolbar.removeEventListener("pointerup", commitDrag);
    toolbar.removeEventListener("pointercancel", cancelDrag);
    toolbar.removeEventListener("lostpointercapture", cancelDrag);
    if (pointerId !== undefined && toolbar.hasPointerCapture?.(pointerId)) toolbar.releasePointerCapture(pointerId);
    drag = null;
  }

  return { mount, destroy, apply, reset, getPreferences };
}

export function normalizeGraphToolbarPrefs(prefs = {}) {
  const edge = EDGES.includes(prefs?.edge) ? prefs.edge : "left";
  const mode = prefs?.mode === "float" ? "float" : "dock";
  return {
    mode: edge === "free" ? "float" : mode,
    edge,
    x: Number(prefs?.x) || 10,
    y: Number(prefs?.y) || 92
  };
}

export function graphToolbarEdgeAt(x, y) {
  const topbar = getTopbarHeight();
  const threshold = 88;
  if (y <= topbar + threshold) return "top";
  if (y >= window.innerHeight - threshold) return "bottom";
  if (x <= threshold) return "left";
  if (x >= window.innerWidth - threshold) return "right";
  return "";
}

function loadPreferences(storageKey) {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "null");
  } catch {
    return null;
  }
}

function getTopbarHeight() {
  return Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--topbar-height")) || 74;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
