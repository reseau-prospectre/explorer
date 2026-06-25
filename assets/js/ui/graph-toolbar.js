export const GRAPH_TOOLBAR_PREFS_KEY = "prospectre.ui.v3.graphToolbar";

const EDGES = ["left", "right", "top", "bottom", "free"];
const RESIZE_DIRECTIONS = ["n", "ne", "e", "se", "s", "sw", "w", "nw"];
const TOOLBAR_GAP = 8;
const TOOLBAR_PADDING = 8;
const MIN_TOOLBAR_SIZE = 48;
const TOOLBAR_CELL = 40;
const DEFAULT_TOOLBAR_SIZE = toolbarSizeForGrid(1, 11);
const DEFAULT_HORIZONTAL_TOOLBAR_SIZE = toolbarSizeForGrid(11, 1);

export function createGraphToolbarController({
  toolbar,
  storageKey = GRAPH_TOOLBAR_PREFS_KEY,
  onChange
} = {}) {
  let drag = null;
  let resize = null;
  let resizeObserver = null;
  let overflowButton = null;
  let overflowMenu = null;
  let dragHandle = null;
  let toolButtons = [];
  let reorderId = "";

  function mount() {
    if (!toolbar) return;
    enhanceToolbar();
    apply(loadPreferences(storageKey));
    toolbar.addEventListener("click", handleToolbarClick);
    toolbar.addEventListener("dragstart", handleReorderStart);
    toolbar.addEventListener("dragover", handleReorderOver);
    toolbar.addEventListener("dragleave", handleReorderLeave);
    toolbar.addEventListener("drop", handleReorderDrop);
    toolbar.addEventListener("dragend", handleReorderEnd);
    document.addEventListener("pointerdown", closeOverflowOnOutside, true);
    document.addEventListener("keydown", handleDocumentKeyDown);
    resizeObserver = new ResizeObserver(updateToolVisibility);
    resizeObserver.observe(toolbar);
    updateToolVisibility();
  }

  function destroy() {
    toolbar?.removeEventListener("click", handleToolbarClick);
    toolbar?.removeEventListener("dragstart", handleReorderStart);
    toolbar?.removeEventListener("dragover", handleReorderOver);
    toolbar?.removeEventListener("dragleave", handleReorderLeave);
    toolbar?.removeEventListener("drop", handleReorderDrop);
    toolbar?.removeEventListener("dragend", handleReorderEnd);
    document.removeEventListener("pointerdown", closeOverflowOnOutside, true);
    document.removeEventListener("keydown", handleDocumentKeyDown);
    resizeObserver?.disconnect();
    resizeObserver = null;
    finishDrag();
    finishResize();
  }

  function apply(prefs) {
    if (!toolbar) return;
    const next = normalizeGraphToolbarPrefs(prefs);
    applyToolOrder(next.order);
    const constrained = constrainToolbarPrefsToTools(next);
    toolbar.dataset.mode = next.mode;
    toolbar.dataset.edge = next.edge;
    toolbar.style.setProperty("--toolbar-x", `${Math.round(constrained.x)}px`);
    toolbar.style.setProperty("--toolbar-y", `${Math.round(constrained.y)}px`);
    toolbar.style.setProperty("--toolbar-width", `${Math.round(constrained.width)}px`);
    toolbar.style.setProperty("--toolbar-height", `${Math.round(constrained.height)}px`);
    toolbar.style.setProperty("--toolbar-columns", String(constrained.columns));
    toolbar.style.setProperty("--toolbar-rows", String(constrained.rows));
    localStorage.setItem(storageKey, JSON.stringify(constrained));
    document.body.dataset.graphToolbarEdge = next.edge;
    updateToolVisibility();
    onChange?.(constrained);
  }

  function reset() {
    apply(normalizeGraphToolbarPrefs({ mode: "dock", edge: "left", x: 10, y: 92, ...DEFAULT_TOOLBAR_SIZE }));
  }

  function getPreferences() {
    return normalizeGraphToolbarPrefs(loadPreferences(storageKey));
  }

  function beginDrag(event) {
    if (event.button !== 0 || !toolbar || drag) return;
    event.preventDefault();
    const rect = toolbar.getBoundingClientRect();
    drag = {
      pointerId: event.pointerId,
      initial: { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      prefs: getPreferences()
    };
    toolbar.classList.add("is-dragging");
    toolbar.dataset.mode = "float";
    closeOverflow();
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
    const orientation = toolbarOrientationForEdge(toolbar.dataset.edge);
    const width = quantizeToolbarExtent(drag.initial.width, "width", orientation);
    const height = quantizeToolbarExtent(drag.initial.height, "height", orientation);
    toolbar.style.setProperty("--toolbar-width", `${Math.round(width)}px`);
    toolbar.style.setProperty("--toolbar-height", `${Math.round(height)}px`);
    onChange?.(normalizeGraphToolbarPrefs({ ...drag.prefs, mode: "float", edge: toolbar.dataset.edge, x, y }));
  }

  function commitDrag(event) {
    if (!drag || (event.pointerId !== undefined && event.pointerId !== drag.pointerId) || !toolbar) return;
    const rect = toolbar.getBoundingClientRect();
    const edge = graphToolbarEdgeAt(event.clientX, event.clientY);
    const edgeSize = edge === "top" || edge === "bottom"
      ? { width: Math.max(drag.prefs.width, DEFAULT_HORIZONTAL_TOOLBAR_SIZE.width), height: Math.min(Math.max(drag.prefs.height, MIN_TOOLBAR_SIZE), 72) }
      : edge === "left" || edge === "right"
        ? { width: Math.min(Math.max(drag.prefs.width, MIN_TOOLBAR_SIZE), 72), height: Math.max(drag.prefs.height, DEFAULT_TOOLBAR_SIZE.height) }
        : {};
    const prefs = edge
      ? { ...drag.prefs, ...edgeSize, mode: "dock", edge, x: Math.round(rect.left), y: Math.round(rect.top) }
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

  function beginResize(event) {
    if (event.button !== 0 || !toolbar || resize) return;
    const handle = event.target.closest("[data-toolbar-resize]");
    if (!handle) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = toolbar.getBoundingClientRect();
    resize = {
      pointerId: event.pointerId,
      direction: handle.dataset.toolbarResize || "se",
      prefs: getPreferences(),
      initial: { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top, width: rect.width, height: rect.height }
    };
    closeOverflow();
    toolbar.classList.add("is-resizing");
    handle.setPointerCapture?.(event.pointerId);
    handle.addEventListener("pointermove", moveResize);
    handle.addEventListener("pointerup", commitResize);
    handle.addEventListener("pointercancel", cancelResize);
    handle.addEventListener("lostpointercapture", cancelResize);
  }

  function moveResize(event) {
    if (!resize || event.pointerId !== resize.pointerId || !toolbar) return;
    const next = calculateResize(event);
    const constrained = constrainToolbarPrefsToTools({
      ...resize.prefs,
      ...next,
      edge: toolbar.dataset.edge || resize.prefs.edge,
      preferredAxis: next.preferredAxis
    });
    applyLiveGeometry(constrained);
    updateToolVisibility();
  }

  function commitResize(event) {
    if (!resize || (event.pointerId !== undefined && event.pointerId !== resize.pointerId) || !toolbar) return;
    const next = calculateResize(event);
    const edge = toolbar.dataset.mode === "dock" ? toolbar.dataset.edge : graphToolbarEdgeAt(next.x, next.y);
    const prefs = normalizeGraphToolbarPrefs({
      ...resize.prefs,
      mode: edge && edge !== "free" ? "dock" : "float",
      edge: edge || "free",
      x: Math.round(next.x),
      y: Math.round(next.y),
      width: Math.round(next.width),
      height: Math.round(next.height),
      preferredAxis: next.preferredAxis
    });
    finishResize();
    apply(prefs);
  }

  function cancelResize() {
    if (!resize) return;
    const previous = resize.prefs;
    finishResize();
    apply(previous);
  }

  function calculateResize(event) {
    const { direction, initial } = resize;
    const dx = event.clientX - initial.x;
    const dy = event.clientY - initial.y;
    let x = initial.left;
    let y = initial.top;
    let width = initial.width;
    let height = initial.height;
    if (direction.includes("e")) width = initial.width + dx;
    if (direction.includes("s")) height = initial.height + dy;
    if (direction.includes("w")) {
      width = initial.width - dx;
      x = initial.left + dx;
    }
    if (direction.includes("n")) {
      height = initial.height - dy;
      y = initial.top + dy;
    }
    width = quantizeToolbarExtent(width, "width", toolbarOrientationForEdge(toolbar.dataset.edge));
    height = quantizeToolbarExtent(height, "height", toolbarOrientationForEdge(toolbar.dataset.edge));
    if (direction.includes("w")) x = initial.left + initial.width - width;
    if (direction.includes("n")) y = initial.top + initial.height - height;
    x = clamp(x, 8, window.innerWidth - width - 8);
    y = clamp(y, getTopbarHeight() + 8, window.innerHeight - height - 8);
    const horizontalDelta = Math.abs(dx);
    const verticalDelta = Math.abs(dy);
    const preferredAxis = direction.includes("e") || direction.includes("w")
      ? direction.includes("n") || direction.includes("s")
        ? horizontalDelta >= verticalDelta ? "width" : "height"
        : "width"
      : "height";
    return { x, y, width, height, preferredAxis };
  }

  function applyLiveGeometry(next) {
    toolbar.style.setProperty("--toolbar-x", `${Math.round(next.x)}px`);
    toolbar.style.setProperty("--toolbar-y", `${Math.round(next.y)}px`);
    toolbar.style.setProperty("--toolbar-width", `${Math.round(next.width)}px`);
    toolbar.style.setProperty("--toolbar-height", `${Math.round(next.height)}px`);
    if (next.columns) toolbar.style.setProperty("--toolbar-columns", String(next.columns));
    if (next.rows) toolbar.style.setProperty("--toolbar-rows", String(next.rows));
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

  function finishResize() {
    if (!toolbar || !resize) return;
    const pointerId = resize.pointerId;
    const handle = toolbar.querySelector(`[data-toolbar-resize="${resize.direction}"]`);
    toolbar.classList.remove("is-resizing");
    handle?.removeEventListener("pointermove", moveResize);
    handle?.removeEventListener("pointerup", commitResize);
    handle?.removeEventListener("pointercancel", cancelResize);
    handle?.removeEventListener("lostpointercapture", cancelResize);
    if (pointerId !== undefined && handle?.hasPointerCapture?.(pointerId)) handle.releasePointerCapture(pointerId);
    resize = null;
  }

  function enhanceToolbar() {
    if (toolbar.dataset.enhanced === "true") {
      collectTools();
      return;
    }
    toolbar.dataset.enhanced = "true";
    toolbar.classList.add("graph-toolbar--adaptive");
    dragHandle = document.createElement("button");
    dragHandle.type = "button";
    dragHandle.className = "toolbar-grab";
    dragHandle.dataset.toolbarDragHandle = "true";
    dragHandle.setAttribute("aria-label", "Déplacer la toolbar");
    dragHandle.innerHTML = `<i>drag_indicator</i><span class="tooltip right">Déplacer</span>`;
    toolbar.prepend(dragHandle);
    dragHandle.addEventListener("pointerdown", beginDrag);

    overflowButton = document.createElement("button");
    overflowButton.type = "button";
    overflowButton.className = "tool-button toolbar-overflow-toggle";
    overflowButton.dataset.toolbarOverflowToggle = "true";
    overflowButton.setAttribute("aria-label", "Afficher les outils masqués");
    overflowButton.setAttribute("aria-expanded", "false");
    overflowButton.innerHTML = `<i>more_horiz</i><span class="tooltip right">Outils masqués</span>`;
    toolbar.append(overflowButton);

    overflowMenu = document.createElement("div");
    overflowMenu.className = "toolbar-overflow-menu hidden";
    overflowMenu.dataset.toolbarOverflowMenu = "true";
    overflowMenu.setAttribute("role", "menu");
    overflowMenu.setAttribute("aria-label", "Outils masqués");
    toolbar.append(overflowMenu);

    const handles = document.createElement("div");
    handles.className = "toolbar-resize-handles";
    handles.setAttribute("aria-hidden", "true");
    RESIZE_DIRECTIONS.forEach((direction) => {
      const handle = document.createElement("span");
      handle.className = `toolbar-resize-handle toolbar-resize-handle--${direction}`;
      handle.dataset.toolbarResize = direction;
      handle.addEventListener("pointerdown", beginResize);
      handles.append(handle);
    });
    toolbar.append(handles);
    collectTools();
  }

  function collectTools() {
    toolButtons = Array.from(toolbar.querySelectorAll(".tool-button:not(.toolbar-overflow-toggle)"));
    toolButtons.forEach((button) => {
      button.draggable = true;
      button.dataset.toolbarToolId = button.id || "";
      button.removeAttribute("title");
    });
    overflowButton = toolbar.querySelector("[data-toolbar-overflow-toggle]");
    overflowMenu = toolbar.querySelector("[data-toolbar-overflow-menu]");
    dragHandle = toolbar.querySelector("[data-toolbar-drag-handle]");
  }

  function updateToolVisibility() {
    if (!toolbar || !overflowButton || !overflowMenu) return;
    const cells = currentGridCellCount();
    const allToolsFit = cells >= toolButtons.length + 1;
    const capacity = allToolsFit ? toolButtons.length : Math.max(0, cells - 2);
    const visibleCount = Math.min(toolButtons.length, capacity);
    const hiddenTools = toolButtons.slice(visibleCount);
    toolbar.classList.toggle("is-minimal", visibleCount === 0);
    toolButtons.forEach((button, index) => {
      button.hidden = index >= visibleCount;
      button.classList.toggle("is-overflowed", index >= visibleCount);
    });
    overflowButton.hidden = hiddenTools.length === 0;
    overflowButton.classList.toggle("is-active", hiddenTools.length > 0);
    renderOverflowMenu(hiddenTools);
    if (!hiddenTools.length) closeOverflow();
  }

  function renderOverflowMenu(hiddenTools) {
    if (!overflowMenu) return;
    overflowMenu.innerHTML = hiddenTools.map((button) => {
      const label = button.getAttribute("aria-label") || button.textContent.trim() || "Outil";
      const icon = button.querySelector("i")?.textContent?.trim() || "radio_button_unchecked";
      const id = button.id || "";
      return `<button type="button" draggable="true" data-toolbar-tool-id="${escapeHtml(id)}" data-toolbar-overflow-action="${escapeHtml(id)}" role="menuitem"><i>${escapeHtml(icon)}</i><span>${escapeHtml(label)}</span></button>`;
    }).join("");
  }

  function applyToolOrder(order = []) {
    collectTools();
    const known = new Set(toolButtons.map((button) => button.id).filter(Boolean));
    const sortedIds = [...order.filter((id) => known.has(id)), ...toolButtons.map((button) => button.id).filter((id) => id && !order.includes(id))];
    sortedIds.forEach((id) => {
      const button = toolButtons.find((item) => item.id === id);
      if (button && overflowButton) toolbar.insertBefore(button, overflowButton);
    });
    collectTools();
  }

  function currentToolOrder() {
    return toolButtons.map((button) => button.id).filter(Boolean);
  }

  function currentVisibleCapacity() {
    const cells = currentGridCellCount();
    return cells >= toolButtons.length + 1 ? toolButtons.length : Math.max(0, cells - 2);
  }

  function currentGridCellCount() {
    if (!toolbar) return 0;
    const rect = toolbar.getBoundingClientRect();
    const grid = toolbarGridForSize(rect.width, rect.height);
    toolbar.style.setProperty("--toolbar-columns", String(grid.columns));
    toolbar.style.setProperty("--toolbar-rows", String(grid.rows));
    return grid.columns * grid.rows;
  }

  function moveToolInOrder(id, { targetId = "", zone = "toolbar" } = {}) {
    if (!id) return;
    const order = currentToolOrder();
    if (!order.includes(id)) return;
    const next = order.filter((item) => item !== id);
    let insertAt = next.length;
    if (targetId && next.includes(targetId)) insertAt = next.indexOf(targetId);
    else if (zone === "overflow") insertAt = Math.min(next.length, Math.max(0, currentVisibleCapacity()));
    else insertAt = Math.min(next.length, Math.max(0, currentVisibleCapacity() - 1));
    next.splice(insertAt, 0, id);
    apply({ ...getPreferences(), order: next });
  }

  function handleReorderStart(event) {
    const source = event.target.closest("[data-toolbar-tool-id]");
    if (!source || source.matches("[data-toolbar-overflow-toggle]")) return;
    reorderId = source.dataset.toolbarToolId || "";
    if (!reorderId) return;
    toolbar.classList.add("is-reordering");
    source.classList.add("is-reorder-source");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", reorderId);
  }

  function handleReorderOver(event) {
    if (!reorderId) return;
    const target = event.target.closest("[data-toolbar-tool-id], [data-toolbar-overflow-toggle], [data-toolbar-overflow-menu]");
    if (!target || !toolbar.contains(target)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    clearReorderTargets();
    target.classList.add("is-reorder-target");
  }

  function handleReorderLeave(event) {
    if (!toolbar.contains(event.relatedTarget)) clearReorderTargets();
  }

  function handleReorderDrop(event) {
    if (!reorderId) return;
    event.preventDefault();
    const overflowZone = event.target.closest("[data-toolbar-overflow-toggle], [data-toolbar-overflow-menu]");
    const action = event.target.closest("[data-toolbar-overflow-action]");
    const visibleTarget = event.target.closest(".tool-button[data-toolbar-tool-id]:not(.toolbar-overflow-toggle)");
    const targetId = action?.dataset.toolbarToolId || visibleTarget?.dataset.toolbarToolId || "";
    const zone = overflowZone && !visibleTarget ? "overflow" : "toolbar";
    moveToolInOrder(reorderId, { targetId: targetId === reorderId ? "" : targetId, zone });
    handleReorderEnd();
  }

  function handleReorderEnd() {
    reorderId = "";
    toolbar?.classList.remove("is-reordering");
    toolbar?.querySelectorAll(".is-reorder-source, .is-reorder-target").forEach((item) => {
      item.classList.remove("is-reorder-source", "is-reorder-target");
    });
  }

  function clearReorderTargets() {
    toolbar?.querySelectorAll(".is-reorder-target").forEach((item) => item.classList.remove("is-reorder-target"));
  }

  function handleToolbarClick(event) {
    const overflowToggle = event.target.closest("[data-toolbar-overflow-toggle]");
    if (overflowToggle) {
      event.preventDefault();
      event.stopPropagation();
      toggleOverflow();
      return;
    }
    const overflowAction = event.target.closest("[data-toolbar-overflow-action]");
    if (overflowAction) {
      const target = toolbar.querySelector(`#${cssEscape(overflowAction.dataset.toolbarOverflowAction)}`);
      closeOverflow();
      target?.click();
    }
  }

  function toggleOverflow() {
    const open = overflowMenu?.classList.contains("hidden");
    overflowMenu?.classList.toggle("hidden", !open);
    overflowButton?.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function closeOverflow() {
    overflowMenu?.classList.add("hidden");
    overflowButton?.setAttribute("aria-expanded", "false");
  }

  function closeOverflowOnOutside(event) {
    if (!toolbar || toolbar.contains(event.target)) return;
    closeOverflow();
  }

  function handleDocumentKeyDown(event) {
    if (event.key === "Escape") closeOverflow();
  }

  function constrainToolbarPrefsToTools(prefs) {
    const maxCells = Math.max(2, toolButtons.length + 1);
    let { columns, rows } = toolbarGridForSize(prefs.width, prefs.height);
    if (columns * rows > maxCells) {
      if (prefs.preferredAxis === "width") {
        columns = Math.min(columns, maxCells);
        rows = Math.max(1, Math.ceil(maxCells / columns));
      } else if (prefs.preferredAxis === "height") {
        rows = Math.min(rows, maxCells);
        columns = Math.max(1, Math.ceil(maxCells / rows));
      } else if (toolbarOrientationForEdge(prefs.edge) === "horizontal") {
        columns = Math.min(columns, maxCells);
        rows = Math.max(1, Math.ceil(maxCells / columns));
      } else {
        rows = Math.min(rows, maxCells);
        columns = Math.max(1, Math.ceil(maxCells / rows));
      }
    }
    const size = toolbarSizeForGrid(columns, rows);
    return {
      ...prefs,
      ...size,
      columns,
      rows,
      x: clamp(prefs.x, 8, window.innerWidth - size.width - 8),
      y: clamp(prefs.y, getTopbarHeight() + 8, window.innerHeight - size.height - 8)
    };
  }

  return { mount, destroy, apply, reset, getPreferences };
}

export function normalizeGraphToolbarPrefs(prefs = {}) {
  const edge = EDGES.includes(prefs?.edge) ? prefs.edge : "left";
  const mode = prefs?.mode === "float" ? "float" : "dock";
  const defaults = edge === "top" || edge === "bottom" ? DEFAULT_HORIZONTAL_TOOLBAR_SIZE : DEFAULT_TOOLBAR_SIZE;
  const orientation = toolbarOrientationForEdge(edge);
  const width = quantizeToolbarExtent(Number(prefs?.width) || defaults.width, "width", orientation);
  const height = quantizeToolbarExtent(Number(prefs?.height) || defaults.height, "height", orientation);
  const grid = toolbarGridForSize(width, height);
  return {
    mode: edge === "free" ? "float" : mode,
    edge,
    x: Number(prefs?.x) || 10,
    y: Number(prefs?.y) || 92,
    width,
    height,
    columns: grid.columns,
    rows: grid.rows,
    preferredAxis: prefs?.preferredAxis === "width" || prefs?.preferredAxis === "height" ? prefs.preferredAxis : "",
    order: Array.isArray(prefs?.order) ? prefs.order.filter(Boolean) : []
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

function toolbarSizeForGrid(columns, rows) {
  return {
    width: TOOLBAR_PADDING * 2 + columns * TOOLBAR_CELL + Math.max(0, columns - 1) * TOOLBAR_GAP,
    height: TOOLBAR_PADDING * 2 + rows * TOOLBAR_CELL + Math.max(0, rows - 1) * TOOLBAR_GAP
  };
}

function toolbarGridForSize(width, height) {
  const availableWidth = Math.max(TOOLBAR_CELL, width - TOOLBAR_PADDING * 2);
  const availableHeight = Math.max(TOOLBAR_CELL, height - TOOLBAR_PADDING * 2);
  return {
    columns: Math.max(1, Math.floor((availableWidth + TOOLBAR_GAP) / (TOOLBAR_CELL + TOOLBAR_GAP))),
    rows: Math.max(1, Math.floor((availableHeight + TOOLBAR_GAP) / (TOOLBAR_CELL + TOOLBAR_GAP)))
  };
}

function quantizeToolbarExtent(value, axis, orientation = "vertical") {
  const viewportMax = axis === "width"
    ? Math.max(MIN_TOOLBAR_SIZE, window.innerWidth - 24)
    : Math.max(MIN_TOOLBAR_SIZE, window.innerHeight - getTopbarHeight() - 16);
  const horizontal = orientation === "horizontal";
  const minCells = axis === "width" ? (horizontal ? 2 : 1) : (horizontal ? 1 : 2);
  const maxCells = Math.max(minCells, Math.floor((viewportMax - TOOLBAR_PADDING * 2 + TOOLBAR_GAP) / (TOOLBAR_CELL + TOOLBAR_GAP)));
  const rawCells = Math.round((Number(value) - TOOLBAR_PADDING * 2 + TOOLBAR_GAP) / (TOOLBAR_CELL + TOOLBAR_GAP));
  const cells = clamp(rawCells || minCells, minCells, maxCells);
  return axis === "width" ? toolbarSizeForGrid(cells, 1).width : toolbarSizeForGrid(1, cells).height;
}

function toolbarOrientationForEdge(edge = "left") {
  return edge === "top" || edge === "bottom" ? "horizontal" : "vertical";
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function cssEscape(value = "") {
  if (window.CSS?.escape) return CSS.escape(value);
  return String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}
